// The open filter panel names its pill groups on screen, and on a phone opening it keeps the list
// in view (fourth critique P2, #42).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const GROUPS = ['Priority', 'Status', 'Tags'] as const

/** The group's visible label: the element its aria-labelledby points at. */
const visibleLabel = (page: Page, name: string) =>
  page.getByRole('group', { name, exact: true }).evaluate((g) => {
    const label = document.getElementById(g.getAttribute('aria-labelledby') ?? '')
    if (!label) return null
    const r = label.getBoundingClientRect()
    return { text: label.textContent, visible: label.checkVisibility() && r.width > 0 && r.height > 0, inside: g.contains(label) }
  })

for (const width of [320, 390, 768, 1280]) {
  test(`each pill group shows its name at ${width}px`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 900 })
    await app.loadSampleData()
    await app.openFilters()
    for (const name of GROUPS) {
      expect(await visibleLabel(page, name), name).toEqual({ text: name, visible: true, inside: true })
    }
    // The label sits before its pills: left of them on phones, above them from sm.
    const group = page.getByRole('group', { name: 'Priority', exact: true })
    const [label, pill] = await Promise.all([
      group.getByText('Priority', { exact: true }).boundingBox(),
      group.getByRole('button', { name: 'Low' }).boundingBox(),
    ])
    if (width < 640) expect(label!.x + label!.width).toBeLessThanOrEqual(pill!.x)
    else expect(label!.y + label!.height).toBeLessThanOrEqual(pill!.y)
    expect(await app.scrollsSideways()).toBe(false)
  })
}

for (const [width, height] of [
  [390, 844],
  [360, 740],
] as const) {
  test(`opening the panel on a ${width}×${height} phone keeps the list in view`, async ({ app, page }) => {
    await page.setViewportSize({ width, height })
    await app.loadSampleData()
    await app.openFilters()
    const toggle = page.getByRole('button', { name: /^Filters/ })
    // Settled: the scroll lands where the panel's bottom leaves room for the list.
    await expect
      .poll(async () => (await app.taskCards().first().boundingBox())!.y, { message: 'the first card starts on screen' })
      .toBeLessThan(height - 120)
    await expect(toggle).toBeInViewport()
    // Still there after picking a filter: the panel doesn't grow.
    await page.getByRole('button', { name: 'Medium', exact: true }).click()
    expect((await app.taskCards().first().boundingBox())!.y).toBeLessThan(height - 120)
  })
}

test('opening the panel where the list already shows leaves the page where it was', async ({ app, page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await app.loadSampleData()
  await app.openFilters()
  expect(await page.evaluate(() => scrollY)).toBe(0)
})
