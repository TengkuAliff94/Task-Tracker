// Sage means done, so a ticked checkbox fills sage, not the brand orange; and the first run keeps
// one brand-orange button (fourth critique P2, #41).
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

async function tokenColour(page: Page, name: string) {
  return page.evaluate((v) => {
    const probe = document.createElement('span')
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(v)
    document.body.append(probe)
    const out = getComputedStyle(probe).color
    probe.remove()
    return out
  }, name)
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

/** The checkbox's fill, edge and tick colours. */
const checkColours = (box: Locator) =>
  box.evaluate((el) => {
    const s = getComputedStyle(el)
    return { fill: s.backgroundColor, edge: s.borderTopColor, tick: getComputedStyle(el, '::after').backgroundColor }
  })

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    test(`a ticked checkbox fills sage, with an edge and tick that read (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.openFilters()
      await page.getByLabel(/Show completed/).check()
      const [sage, primary, surface] = await Promise.all(
        ['--panel-sage', '--primary', '--surface'].map((t) => tokenColour(page, t)),
      )
      const round = page.locator('.task-check:checked').first()
      const square = page.getByLabel(/Show completed/)
      for (const box of [round, square]) {
        // Polled: the fill eases over 200ms.
        await expect.poll(async () => (await checkColours(box)).fill).toBe(sage)
        const { edge, tick } = await checkColours(box)
        expect(edge).not.toBe(primary)
        expect(contrast(edge, surface), 'the checked box stands out from the card').toBeGreaterThanOrEqual(3)
        expect(contrast(tick, sage), 'the tick reads on the sage').toBeGreaterThanOrEqual(3)
      }
    })

    test(`hovering an open task's checkbox previews sage, not orange (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      const box = app.taskRow('Pay rent').getByRole('checkbox')
      await box.hover()
      const primary = await tokenColour(page, '--primary')
      await expect.poll(async () => (await checkColours(box)).edge).not.toBe(primary)
      const surface = await tokenColour(page, '--surface')
      expect(contrast((await checkColours(box)).edge, surface)).toBeGreaterThanOrEqual(3)
    })

    test(`the first run has exactly one brand-orange button (${colorScheme})`, async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Load sample data' })).toBeVisible()
      const orange = await tokenColour(page, '--panel-orange')
      const brand = await page
        .getByRole('button')
        .evaluateAll(
          (els, c) => els.filter((e) => e.checkVisibility() && getComputedStyle(e).backgroundColor === c).map((e) => e.textContent?.trim()),
          orange,
        )
      expect(brand).toEqual(['New task'])
      // Load sample data is still the empty state's main action: ink, and at least 4.5:1.
      const sample = page.getByRole('button', { name: 'Load sample data' })
      const [bg, fg] = await sample.evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])
      expect(bg).toBe(await tokenColour(page, '--fg'))
      expect(contrast(bg, fg)).toBeGreaterThanOrEqual(4.5)
    })
  })
}
