// How the list is arranged is remembered on this device (eighth critique P2, step 41, #64): Sort by,
// Group by and Show completed survive a reload; filters don't. A non-Smart sort shows as a quiet
// chip while the panel is collapsed, since the order is otherwise unexplained.
import type { Page } from '@playwright/test'
import { expect, test, type App } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const showCompleted = (page: Page) => page.getByRole('checkbox', { name: /^Show completed/ })
const sortChip = (page: Page) => page.locator('[data-sort-chip]')

async function reload(app: App) {
  await app.page.reload()
  await expect(app.taskRow('Pay rent')).toBeVisible()
}

test('Sort, Group by and Show completed survive a reload; a filter does not', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await page.getByLabel('Sort by').selectOption({ label: 'Deadline' })
  await page.getByLabel('Group by').selectOption({ label: 'Project' })
  await showCompleted(page).check()
  await page.getByRole('button', { name: 'High', exact: true }).click()

  await reload(app)
  await app.openFilters()
  await expect(page.getByLabel('Sort by')).toHaveValue('deadline')
  await expect(page.getByLabel('Group by')).toHaveValue('project')
  await expect(showCompleted(page)).toBeChecked()
  await expect(page.getByRole('button', { name: 'High', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('list', { name: 'Home tasks' })).toBeVisible()

  // Back to the defaults, and a reload keeps those too.
  await page.getByLabel('Sort by').selectOption({ label: 'Smart' })
  await page.getByLabel('Group by').selectOption({ label: 'No grouping' })
  await showCompleted(page).uncheck()
  await reload(app)
  await app.openFilters()
  await expect(page.getByLabel('Sort by')).toHaveValue('smart')
  await expect(page.getByLabel('Group by')).toHaveValue('none')
  await expect(showCompleted(page)).not.toBeChecked()
})

test('a non-Smart sort shows as a chip while collapsed; it is not a filter, and pressing it puts Smart back', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(sortChip(page)).toHaveCount(0)
  await app.openFilters()
  await page.getByLabel('Sort by').selectOption({ label: 'Title A–Z' })
  await page.getByRole('button', { name: 'Urgent', exact: true }).click()
  await expect(sortChip(page), 'not while the panel shows the select').toHaveCount(0)
  await app.filtersToggle.click()

  await expect(sortChip(page)).toHaveText('Sorted by Title A–Z')
  await expect(sortChip(page)).toHaveAccessibleName('Sorted by Title A–Z. Sort by Smart instead')
  // The Filters badge counts the one filter, not the sort.
  await expect(app.filtersToggle).toHaveAccessibleName('Filters 1 active')

  // Clear filters takes the filter off and leaves the sort.
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(sortChip(page)).toHaveText('Sorted by Title A–Z')

  await sortChip(page).click()
  await expect(sortChip(page)).toHaveCount(0)
  await expect(app.filtersToggle).toBeFocused()
  await app.openFilters()
  await expect(page.getByLabel('Sort by')).toHaveValue('smart')
})

test('a stored value the app does not know is ignored', async ({ app, page }) => {
  await page.evaluate(() => localStorage.setItem('arrangement', '{"sort":"shuffle","group":"project","showCompleted":1}'))
  await app.loadSampleData()
  await reload(app)
  await app.openFilters()
  await expect(page.getByLabel('Sort by')).toHaveValue('smart')
  await expect(page.getByLabel('Group by')).toHaveValue('project')
  await expect(showCompleted(page)).not.toBeChecked()
})

test('blocked storage still lets the list be arranged', async ({ app, page }) => {
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    Storage.prototype.getItem = blocked
    Storage.prototype.setItem = blocked
    Storage.prototype.removeItem = blocked
  })
  await app.loadSampleData()
  await reload(app)
  await app.openFilters()
  await page.getByLabel('Sort by').selectOption({ label: 'Deadline' })
  await expect(page.getByLabel('Sort by')).toHaveValue('deadline')
  await expect(app.taskRow('Pay rent')).toBeVisible()
})
