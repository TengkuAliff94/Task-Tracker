// The top of the list says what's urgent, and each Overview tile filters the list to what it counts.
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const overview = (page: Page) => page.getByRole('region', { name: 'Overview' })
const tile = (page: Page, label: string) => overview(page).getByRole('button', { name: new RegExp(`^${label}\\b`) })

// At FIXED_NOW (Tue 10 Mar, 09:00) the sample set has 8 open tasks. Overdue: "Renew car insurance"
// (2 days ago) and "Morning run" (07:00, already passed). Due today, still to come: "Reply to recruiter
// email" (18:00). The two never overlap.

test('the heading says what is most urgent', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(page.getByRole('heading', { level: 1, name: 'Tasks' })).toBeVisible()
  await expect(page.getByText('2 overdue', { exact: true })).toBeVisible()
})

test('the tiles run most urgent first', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(overview(page).getByRole('button')).toHaveText([/^Overdue/, /^Due today/, /^Open/, /^Completed/])
})

test('picking a tile filters the list to what it counts, and picking it again clears it', async ({ app, page }) => {
  await app.loadSampleData()
  const overdue = tile(page, 'Overdue')
  await expect(overdue).toHaveAttribute('aria-pressed', 'false')

  await overdue.click()
  await expect(overdue).toHaveAttribute('aria-pressed', 'true')
  await expect(app.taskCards()).toHaveCount(2)
  await expect(app.taskRow('Renew car insurance')).toBeVisible()
  await expect(app.taskRow('Morning run')).toBeVisible()
  await expect(page.getByText('2 overdue tasks', { exact: true })).toBeVisible()

  // One tile at a time: picking another replaces it.
  const today = tile(page, 'Due today')
  await today.click()
  await expect(overdue).toHaveAttribute('aria-pressed', 'false')
  await expect(today).toHaveAttribute('aria-pressed', 'true')
  await expect(app.taskCards()).toHaveCount(1)
  await expect(app.taskRow('Reply to recruiter email')).toBeVisible()
  await expect(page.getByText('1 task due today', { exact: true })).toBeVisible()

  await today.click()
  await expect(today).toHaveAttribute('aria-pressed', 'false')
  await expect(app.taskCards()).toHaveCount(8)
})

test('Overdue and Due today never count the same task', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(tile(page, 'Overdue')).toHaveAccessibleName(/^Overdue\s*2/)
  await expect(tile(page, 'Due today')).toHaveAccessibleName(/^Due today\s*1/)

  // "Morning run" was due at 07:00 and it's 09:00: overdue, so not under Due today.
  await tile(page, 'Due today').click()
  await expect(app.taskRow('Reply to recruiter email')).toBeVisible()
  await expect(app.taskRow('Morning run')).toHaveCount(0)
})

test('Due today with nothing still to come points to Overdue', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByLabel('Mark "Reply to recruiter email" as done').click()
  await tile(page, 'Due today').click()
  await expect(page.getByRole('heading', { name: 'Nothing due today' })).toBeVisible()
  await expect(page.getByText('Anything already late is under Overdue.')).toBeVisible()
})

test('the new count is announced as a status after picking a tile', async ({ app, page }) => {
  await app.loadSampleData()
  await tile(page, 'Overdue').click()
  await expect(page.getByRole('status').filter({ hasText: /^2 overdue tasks$/ })).toBeVisible()
})

test('a picked tile with nothing to show says so, with a way back to every task', async ({ app, page }) => {
  await app.loadSampleData()
  // Finish both overdue tasks ("Morning run" repeats, so its next one is due tomorrow).
  for (const title of ['Renew car insurance', 'Morning run']) await page.getByLabel(`Mark "${title}" as done`).click()
  await expect(tile(page, 'Overdue')).toHaveAccessibleName(/^Overdue\s*0$/)

  await tile(page, 'Overdue').click()
  await expect(page.getByRole('heading', { name: 'Nothing overdue' })).toBeVisible()
  await page.getByRole('button', { name: 'Show all tasks' }).click()
  await expect(tile(page, 'Overdue')).toHaveAttribute('aria-pressed', 'false')
  await expect(app.taskCards()).not.toHaveCount(0)
})

test('a tile left picked when the list empties is dropped, so the next task shows', async ({ app, page }) => {
  await app.quickAdd('Late task yesterday')
  await tile(page, 'Overdue').click()
  await expect(app.taskCards()).toHaveCount(1)

  // Delete the only task while Overdue is picked: the list empties and the tiles go with it.
  await app.taskRow('Late task').getByRole('button').click()
  await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
  await expect(overview(page)).toHaveCount(0)

  // A task with no deadline isn't overdue; it would stay hidden if the pick had survived.
  await app.quickAdd('Next task')
  await expect(app.taskRow('Next task')).toBeVisible()
  await expect(tile(page, 'Overdue')).toHaveAttribute('aria-pressed', 'false')
})

test('the Completed tile shows only completed tasks, and picking it again resets it', async ({ app, page }) => {
  await app.loadSampleData()
  await tile(page, 'Completed').click()
  await expect(app.taskCards()).toHaveCount(2)
  await expect(page.getByText('2 completed tasks', { exact: true })).toBeVisible()
  // The tile alone is its own way back: no lone Clear filters repeats it (#39).
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)

  await tile(page, 'Completed').click()
  await expect(tile(page, 'Completed')).toHaveAttribute('aria-pressed', 'false')
  await expect(app.taskCards()).toHaveCount(8)
})

test('with a search as well, Clear filters takes the tile off too', async ({ app, page }) => {
  await app.loadSampleData()
  await tile(page, 'Open').click()
  await page.getByLabel('Search tasks').fill('run')
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(tile(page, 'Open')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByLabel('Search tasks')).toHaveValue('')
})
