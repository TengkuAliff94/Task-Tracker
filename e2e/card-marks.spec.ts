// Each mark on a task card has its own form (#36): the Urgent stripe down the left edge (#40), the
// overdue outline around the card, and selection as a lift plus an ink marker in the gutter.
// Selection never draws a ring, never hides the overdue outline, and the title's own focus ring
// steps aside while its card is selected.
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const marker = (card: Locator) => card.locator('[data-selection-marker]')

/** The card's spread-only box-shadows (rings), as their colours: e.g. ["rgb(110, 17, 22)"]. */
const rings = (card: Locator) =>
  card.evaluate((el) =>
    [...getComputedStyle(el).boxShadow.matchAll(/(rgba?\([^)]+\)) 0px 0px 0px ([1-9]\d*)px/g)].map((m) => m[1]),
  )

/** Selects a card the way a keyboard user does: Tab (focus) to its title. */
async function select(page: Page, card: Locator) {
  // Only keyboard focus selects (`:focus-visible`), so a key press comes first.
  await page.keyboard.press('Shift')
  await card.locator('[data-card-edit]').focus()
  await expect(card).toHaveAttribute('aria-current', 'true')
}

function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = c.match(/[\d.]+/g)!.slice(0, 3).map((v) => {
      const s = Number(v) / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const canvas = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    test(`a selected card shows the marker and no ring (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      const card = app.taskRow('Reply to recruiter email')
      await expect(marker(card)).toHaveCSS('opacity', '0')

      await select(page, card)
      await expect(marker(card)).toHaveCSS('opacity', '1')
      expect(await rings(card), 'selection draws no ring around the card').toEqual([])

      // The marker sits in the gutter, outside the card, in ink that reads on the canvas.
      const [m, c] = [await marker(card).boundingBox(), await card.boundingBox()]
      expect(m!.x + m!.width).toBeLessThanOrEqual(c!.x)
      const ink = await marker(card).evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(contrast(ink, await canvas(page))).toBeGreaterThanOrEqual(3)
    })

    test(`a selected overdue card keeps its outline, which reads on the canvas (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      const card = app.taskRow('Renew car insurance')
      const before = await rings(card)
      expect(before, 'one outline: overdue').toHaveLength(1)
      expect(contrast(before[0], await canvas(page))).toBeGreaterThanOrEqual(3)

      await select(page, card)
      await expect(marker(card)).toHaveCSS('opacity', '1')
      expect(await rings(card)).toEqual(before)
    })

    test(`a selected High card's marker is the only ink bar on the list (${colorScheme}, #40)`, async ({ app, page }) => {
      await app.loadSampleData()
      const card = app.taskRow('Pay rent')
      await select(page, card)
      // Every bar-shaped mark on any card (stripe or marker) whose colour is the ink token.
      const inkBars = await page.locator('[data-task-id]').evaluateAll((cards) => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--fg)'
        document.body.append(probe)
        const ink = getComputedStyle(probe).color
        probe.remove()
        return cards.flatMap((c) =>
          [...c.querySelectorAll<HTMLElement>('[data-priority-stripe], [data-selection-marker]')]
            .filter((el) => getComputedStyle(el).backgroundColor === ink && getComputedStyle(el).opacity !== '0')
            .map((el) => `${c.getAttribute('data-task-id')}:${el.hasAttribute('data-selection-marker') ? 'marker' : 'stripe'}`),
        )
      })
      expect(inkBars).toHaveLength(1)
      expect(inkBars[0]).toMatch(/:marker$/)
    })

    test(`the title's own focus ring steps aside while its card is selected (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await page.keyboard.press('j')
      const title = page.locator('li[aria-current] [data-card-edit]')
      await expect(title).toBeFocused()
      await expect(title).toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)')
      // Nor its halo, which would otherwise draw a box inside the card.
      await expect(title).toHaveCSS('box-shadow', 'none')
      // The checkbox beside it still shows its own ring.
      await page.keyboard.press('Shift+Tab')
      await expect(page.locator('li[aria-current] input[type="checkbox"]')).toBeFocused()
      await expect(page.locator('li[aria-current] input[type="checkbox"]')).not.toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)')
    })
  })
}

for (const width of [320, 768]) {
  test(`the marker fits the gutter at ${width}px without sideways scrolling`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 900 })
    await app.loadSampleData()
    const cards = app.taskCards()
    // On two columns, the second card's marker sits in the gap, nearer its own card.
    const card = width >= 768 ? cards.nth(1) : cards.first()
    await select(page, card)
    const [m, c] = [await marker(card).boundingBox(), await card.boundingBox()]
    expect(m!.x).toBeGreaterThanOrEqual(0)
    if (width >= 768) {
      const left = await cards.nth(0).boundingBox()
      expect(m!.x - (left!.x + left!.width), 'clear of the neighbour').toBeGreaterThan(c!.x - (m!.x + m!.width))
    }
    expect(await app.scrollsSideways()).toBe(false)
  })
}
