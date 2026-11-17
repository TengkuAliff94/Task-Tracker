// The top of the Task List view: a heading panel with today's date, the Overview tiles and the
// quick-add panel. Side by side on a wide screen, stacked in one column on a phone, and never
// wider than the screen.
import type { Page } from '@playwright/test'
import { box, expect, test } from './fixtures'

// These measure where panels settle, so run with reduced motion: mid-entrance they're offset.
test.use({ reducedMotion: 'reduce' })

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
    expect(await app.scrollsSideways()).toBe(false)
  })
})

// Short visits are for checking what's overdue and ticking it off, so the first task must be on
// the first screen, even with the backup reminder showing (sample tasks are old enough to trigger it).
for (const viewport of [
  { width: 1280, height: 900 },
  { width: 1024, height: 768 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport })

    test('the first task card is fully on the first screen', async ({ app, page }) => {
      await app.loadSampleData()
      await expect(page.getByRole('button', { name: 'Remind me later' })).toBeVisible()
      const first = await box(app.taskCards().first())
      expect(first.y + first.height).toBeLessThanOrEqual(viewport.height)
      expect(await app.scrollsSideways()).toBe(false)
    })
  })
}

// 320px is also a 1280px screen at 400% zoom (WCAG reflow): every tile keeps its whole label.
test.describe('narrowest phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('the Overview tile labels are never cut off', async ({ app, page }) => {
    await app.loadSampleData()
    const labels = page.getByRole('region', { name: 'Overview' }).locator('button span.truncate')
    await expect(labels).toHaveCount(4)
    const cut = await labels.evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth).map((e) => e.textContent))
    expect(cut).toEqual([])
    expect(await app.scrollsSideways()).toBe(false)
  })
})

test.describe('phone, first run', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the way out of the empty list is on the first screen, with no filters for an empty list', async ({ app, page }) => {
    void app
    const load = await box(page.getByRole('button', { name: 'Load sample data' }))
    expect(load.y + load.height).toBeLessThanOrEqual(844)
    await expect(page.getByLabel('Search tasks')).toHaveCount(0)
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
    expect(await app.scrollsSideways()).toBe(false)
  })
})
