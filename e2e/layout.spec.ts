// The top of the Task List view: a heading panel with today's date, the Overview tiles and the
// quick-add panel. Side by side on a wide screen, stacked in one column on a phone, and never
// wider than the screen.
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function box(locator: Locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('not rendered')
  return b
}

/** True when the page can scroll sideways, i.e. something is wider than the screen. */
const scrollsSideways = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)

const heading = (page: Page) => page.getByRole('heading', { level: 1, name: 'Tasks' })
const overview = (page: Page) => page.getByRole('region', { name: 'Overview' })

test('the heading shows today\'s date', async ({ app, page }) => {
  void app // opens the app
  // FIXED_NOW is Tuesday 10 March 2026.
  await expect(heading(page)).toBeVisible()
  await expect(page.getByText('Tuesday 10 March', { exact: true })).toBeVisible()
})

test.describe('wide screen', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('the heading and the Overview sit side by side, with quick add below', async ({ app, page }) => {
    await app.loadSampleData()
    const h = await box(heading(page))
    const o = await box(overview(page))
    const q = await box(app.quickAddInput)

    expect(o.x, 'Overview is to the right of the heading').toBeGreaterThan(h.x + h.width)
    expect(o.y, 'and shares its row').toBeLessThan(h.y + h.height)
    expect(q.y, 'quick add comes after both').toBeGreaterThan(o.y + o.height)
    expect(await scrollsSideways(page)).toBe(false)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the heading, Overview and quick add stack in one column without sideways scrolling', async ({ app, page }) => {
    await app.loadSampleData()
    const h = await box(heading(page))
    const o = await box(overview(page))
    const q = await box(app.quickAddInput)

    expect(o.y, 'Overview is below the heading').toBeGreaterThan(h.y + h.height)
    expect(q.y, 'quick add is below the Overview').toBeGreaterThan(o.y + o.height)
    expect(await scrollsSideways(page)).toBe(false)
  })
})
