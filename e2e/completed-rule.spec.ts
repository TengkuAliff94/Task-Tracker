// One rule for completed tasks: "Show completed" alone lets them into the list. The status pills are
// To Do and In Progress only, and while the Completed tile is picked the box reads ticked.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const tile = (page: Page, label: string) =>
  page.getByRole('region', { name: 'Overview' }).getByRole('button', { name: new RegExp(`^${label}\\b`) })
const showCompleted = (page: Page) => page.getByRole('checkbox', { name: /^Show completed/ })
const doneCards = (page: Page) => page.getByRole('checkbox', { name: /as not done$/ })

test('the status filter offers only open statuses, and never lists a done task', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  const status = page.getByRole('group', { name: 'Status' })
  await expect(status.getByRole('button')).toHaveText(['To Do', 'In Progress'])

  await showCompleted(page).click()
  await expect(doneCards(page)).toHaveCount(2)
  await status.getByRole('button', { name: 'In Progress' }).click()
  await expect(app.taskRow('Prepare quarterly review slides')).toBeVisible()
  await expect(doneCards(page)).toHaveCount(0)
})

test('picking Completed ticks "Show completed"; unpicking puts it back as it was', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await expect(showCompleted(page)).not.toBeChecked()

  await tile(page, 'Completed').click()
  await expect(doneCards(page)).toHaveCount(2)
  await expect(showCompleted(page)).toBeChecked()

  await tile(page, 'Completed').click()
  await expect(doneCards(page)).toHaveCount(0)
  await expect(showCompleted(page)).not.toBeChecked()
})

test('unticking "Show completed" while Completed is picked unpicks the tile', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await tile(page, 'Completed').click()
  await expect(tile(page, 'Completed')).toHaveAttribute('aria-pressed', 'true')

  await showCompleted(page).click()
  await expect(tile(page, 'Completed')).toHaveAttribute('aria-pressed', 'false')
  await expect(showCompleted(page)).not.toBeChecked()
  await expect(doneCards(page)).toHaveCount(0)
  await expect(app.taskCards()).toHaveCount(8)
})

test('with "Show completed" on, picking and unpicking Completed keeps it on', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await showCompleted(page).click()
  await tile(page, 'Completed').click()
  await tile(page, 'Completed').click()
  await expect(showCompleted(page)).toBeChecked()
  await expect(app.taskCards()).toHaveCount(10)
})
