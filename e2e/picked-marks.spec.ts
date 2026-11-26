// Step 35 (#58): a picked tile and pressed Trash don't borrow another state's form or colour.
import { expect, test } from './fixtures'

const tile = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('region', { name: 'Overview' }).getByRole('button', { name: new RegExp(`^${name}`) })

for (const width of [390, 1280]) {
  test(`a picked tile shows a clear mark, not a check (${width}px)`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 900 })
    await app.loadSampleData()
    const open = tile(page, 'Open')
    await open.click()
    const mark = open.locator('[data-picked-mark]:visible')
    await expect(mark).toHaveCount(1)
    await expect(mark).toHaveAttribute('data-picked-mark', 'clear')
    await expect(mark.locator('svg.lucide-x')).toHaveCount(1)
    await expect(open.locator('svg.lucide-check')).toHaveCount(0)
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`pressed Trash is ink, not mustard (${theme})`, async ({ app, page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.setViewportSize({ width: 1280, height: 900 })
    await app.loadSampleData()
    const trash = page.getByRole('button', { name: /^Trash \(/ })
    await trash.click()
    await expect(trash).toHaveAttribute('aria-pressed', 'true')
    const read = () =>
      trash.evaluate((el) => {
        const probe = document.createElement('i')
        document.body.append(probe)
        probe.style.color = 'var(--fg)'
        const fg = getComputedStyle(probe).color
        probe.style.color = 'var(--bg)'
        const bg = getComputedStyle(probe).color
        probe.remove()
        const s = getComputedStyle(el)
        return { back: s.backgroundColor, text: s.color, fg, bg }
      })
    await expect.poll(async () => { const r = await read(); return r.back === r.fg && r.text === r.bg }).toBe(true)
  })
}
