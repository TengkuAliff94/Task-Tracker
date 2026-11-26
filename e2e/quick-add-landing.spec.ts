// A quick add never vanishes unsaid (step 28, #51). One the picked tile or a filter hides gets a toast
// that says so, with Show it; one that lands in view becomes the selection and is announced.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const tile = (page: Page, label: string) =>
  page.getByRole('region', { name: 'Overview' }).getByRole('button', { name: new RegExp(`^${label}\\b`) })
const hiddenToast = (page: Page) => page.getByRole('status').filter({ hasText: /^Added “.*Hidden by / })
const announcer = (page: Page) => page.locator('[aria-live="polite"]')

test('a quick add the picked tile hides says so, and Show it brings it into view', async ({ app, page }) => {
  await app.loadSampleData()
  await tile(page, 'Overdue').click()
  await expect(tile(page, 'Overdue')).toHaveAttribute('aria-pressed', 'true')

  await app.quickAdd('Call the plumber next week')
  const toast = hiddenToast(page)
  await expect(toast).toContainText('Added “Call the plumber”')
  await expect(toast).toContainText('Hidden by the Overdue tile.')
  // Focus is still in the field, where Z would be typed, so the announcement doesn't offer it.
  await expect(announcer(page)).toHaveText('Added “Call the plumber”. Hidden by the Overdue tile.')
  await expect(app.quickAddInput).toBeFocused()
  await expect(app.taskRow('Call the plumber')).toHaveCount(0)

  await toast.getByRole('button', { name: 'Show it' }).click()
  await expect(tile(page, 'Overdue')).toHaveAttribute('aria-pressed', 'false')
  const row = app.taskRow('Call the plumber')
  await expect(row).toBeVisible()
  await expect(row).toHaveAttribute('aria-current', 'true')
  await expect(row.locator('[data-card-edit]')).toBeFocused()
  await expect(toast).toHaveCount(0)
})

test('a quick add a search hides says so too, and Z shows it', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByRole('searchbox', { name: /search/i }).fill('insurance')
  await app.quickAdd('Water the plants')
  await expect(hiddenToast(page)).toContainText('Added “Water the plants”')
  await expect(hiddenToast(page)).toContainText('Hidden by your filters.')

  await app.quickAddInput.blur()
  await page.keyboard.press('z')
  await expect(app.taskRow('Water the plants')).toBeVisible()
  await expect(page.getByRole('searchbox', { name: /search/i })).toHaveValue('')
})

test('Show it keeps Show completed as it was', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  const showCompleted = page.getByRole('checkbox', { name: /Show completed/ })
  await showCompleted.check()
  await page.getByRole('button', { name: 'High', exact: true }).click()
  await app.quickAdd('Low key errand !low')
  await hiddenToast(page).getByRole('button', { name: 'Show it' }).click()
  await expect(app.taskRow('Low key errand')).toBeVisible()
  await expect(showCompleted).toBeChecked()
})

test('a quick add that lands in view is selected and announced, with no toast', async ({ app, page }) => {
  await app.loadSampleData()
  await app.quickAdd('Buy stamps')
  const row = app.taskRow('Buy stamps')
  await expect(row).toBeVisible()
  await expect(row).toHaveAttribute('aria-current', 'true')
  await expect(announcer(page)).toContainText('Added “Buy stamps”.')
  await expect(hiddenToast(page)).toHaveCount(0)
  // Focus stays in the bar for the next line.
  await expect(app.quickAddInput).toBeFocused()
})
