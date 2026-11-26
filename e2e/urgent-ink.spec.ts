// Red means overdue (and danger) alone (eighth critique P1, step 38, #61). Urgent used to be rust,
// which read as the same red as the overdue date beside it; now every Urgent mark is ink, there's no
// priority stripe, and the Trash count isn't red either.
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

const channels = (c: string) => c.match(/[\d.]+/g)!.slice(0, 3).map(Number)
const linear = (v: number) => {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** OKLCH chroma and hue (degrees). */
function oklch(c: string) {
  const [r, g, b] = channels(c).map(linear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { chroma: Math.hypot(A, B), hue: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

/** True when a colour can't be read as the danger red: nearly grey, or 30° or more of hue away. */
function clearOfDanger(c: string, danger: string) {
  const a = oklch(c)
  if (a.chroma < 0.04) return true
  const d = Math.abs(a.hue - oklch(danger).hue) % 360
  return Math.min(d, 360 - d) >= 30
}

const bgOf = (el: Locator) => el.evaluate((e) => getComputedStyle(e).backgroundColor)

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    test('every Urgent mark is ink, clear of the danger red', async ({ app, page }) => {
      await app.loadSampleData()
      const [danger, ink] = await Promise.all([tokenColour(page, '--danger'), tokenColour(page, '--fg')])
      const marks: [string, Locator][] = []

      marks.push(['card badge', app.taskRow('Renew car insurance').locator('[data-priority="urgent"]')])

      await app.quickAddInput.fill('Call the bank !urgent')
      marks.push(['quick-add preview', app.quickAddPreview.getByText('Urgent', { exact: true })])
      for (const [what, el] of marks) {
        await expect(el, what).toBeVisible()
        const bg = await bgOf(el)
        expect(bg, `${what} is ink`).toBe(ink)
        expect(clearOfDanger(bg, danger), `${what} (${bg}) isn't read as danger`).toBe(true)
      }
      await app.quickAddInput.fill('')

      await app.openFilters()
      const pill = page.getByRole('button', { name: 'Urgent', exact: true })
      await pill.click()
      await expect(pill).toHaveAttribute('aria-pressed', 'true')
      await page.mouse.move(0, 0)
      expect(await bgOf(pill), 'pressed Urgent pill is ink').toBe(ink)
      await pill.click()

      await page.getByLabel('Group by').selectOption({ label: 'Priority' })
      const tab = page.locator('h2').filter({ hasText: /^Urgent\d+$/ }).locator('span').first()
      await expect(tab).toBeVisible()
      expect(await bgOf(tab), 'Urgent group tab is ink').toBe(ink)
    })

    test('no card draws a priority stripe', async ({ app, page }) => {
      await app.loadSampleData()
      await expect(app.taskRow('Renew car insurance').locator('[data-priority="urgent"]')).toHaveCount(1)
      await expect(page.locator('[data-priority-stripe]')).toHaveCount(0)
    })

    test('the Trash count is ink, not red', async ({ app, page }) => {
      await app.loadSampleData()
      const [danger, ink] = await Promise.all([tokenColour(page, '--danger'), tokenColour(page, '--fg')])
      await page.keyboard.press('j')
      await page.keyboard.press('Delete')
      const trash = page.getByRole('button', { name: 'Trash (1)' })
      await expect(trash).toBeVisible()
      const badge = trash.locator('span.rounded-full').filter({ hasText: /^1$/ })
      await expect(badge).toBeVisible()
      const bg = await bgOf(badge)
      expect(bg).toBe(ink)
      expect(clearOfDanger(bg, danger)).toBe(true)
    })

    test('no rust is left in the tokens', async ({ app, page }) => {
      const left = await page.evaluate(() => {
        const css = getComputedStyle(document.documentElement)
        return ['--panel-rust', '--accent'].filter((t) => css.getPropertyValue(t).trim() !== '')
      })
      expect(left).toEqual([])
    })
  })
}
