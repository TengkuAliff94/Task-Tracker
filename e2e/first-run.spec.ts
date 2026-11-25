// The first screen says what makes the app different (#37): local-first, no account, offline.
// It belongs to the first run only; once there are tasks, it has done its job.
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const LINE = 'Stored only in this browser. No account, works offline.'

test('the first-run empty state says where the data lives', async ({ page }) => {
  await page.goto('/')
  const empty = page.getByRole('region', { name: 'No tasks yet' })
  await expect(empty.getByText(LINE)).toBeVisible()
})

test('the line goes once there are tasks, and other empty states never show it', async ({ app, page }) => {
  await app.quickAdd('Water the plants')
  await expect(page.getByText(LINE)).toHaveCount(0)

  // A search with no matches is an empty list too, but not a first run.
  await page.getByRole('searchbox').fill('zzz')
  await expect(page.getByRole('heading', { name: 'No matches' })).toBeVisible()
  await expect(page.getByText(LINE)).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the line reads at 4.5:1 and wraps cleanly at 320 (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/')
    const note = page.locator('[data-first-run-note]')
    await expect(note).toBeVisible()

    const ratio = await note.evaluate((el) => {
      const rgb = (c: string) => c.match(/[\d.]+/g)!.slice(0, 3).map(Number)
      const lum = (c: number[]) =>
        c.map((v) => v / 255).map((s) => (s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4)).reduce((a, s, i) => a + s * [0.2126, 0.7152, 0.0722][i], 0)
      let bg: Element | null = el
      while (bg && getComputedStyle(bg).backgroundColor === 'rgba(0, 0, 0, 0)') bg = bg.parentElement
      const [hi, lo] = [lum(rgb(getComputedStyle(el).color)), lum(rgb(getComputedStyle(bg!).backgroundColor))].sort((a, b) => b - a)
      return (hi + 0.05) / (lo + 0.05)
    })
    expect(ratio).toBeGreaterThanOrEqual(4.5)

    // Inside its card, no sideways scrolling.
    const [n, card] = [await note.boundingBox(), await page.locator('[data-empty-state]').boundingBox()]
    expect(n!.x).toBeGreaterThanOrEqual(card!.x)
    expect(n!.x + n!.width).toBeLessThanOrEqual(card!.x + card!.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  })
}
