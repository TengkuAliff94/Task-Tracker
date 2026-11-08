// The filter bar, the Trash view and the empty states: restyled as panels, behaving as before.
// Empty states carry a gently floating icon that keeps still when motion is reduced.
import type { Page } from '@playwright/test'
import { expect, isAnimating, test } from './fixtures'

/** The empty-state panel whose title is `title`. */
const emptyState = (page: Page, title: string) => page.getByRole('region', { name: title, exact: true })

/** Longer than any entrance animation, so only an ongoing one is still running after it. */
const AFTER_ENTRANCES = 1200

test('the empty state\'s icon keeps gently moving after the page has settled', async ({ app, page }) => {
  void app // opens the app on the "No tasks yet" empty state
  await page.waitForTimeout(AFTER_ENTRANCES)
  expect(await isAnimating(emptyState(page, 'No tasks yet'))).toBe(true)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the empty state keeps still', async ({ app, page }) => {
    void app // opens the app
    expect(await isAnimating(emptyState(page, 'No tasks yet'))).toBe(false)
    await page.waitForTimeout(AFTER_ENTRANCES)
    expect(await isAnimating(emptyState(page, 'No tasks yet'))).toBe(false)
  })
})

test('a trashed task shows as a card with when it was deleted and how long it has left', async ({ app, page }) => {
  await app.quickAdd('Old errand')
  await app.taskRow('Old errand').getByRole('button').click()
  await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Trash (1)' }).click()

  const card = page.getByRole('list', { name: 'Trashed tasks' }).getByRole('listitem').filter({ hasText: 'Old errand' })
  // FIXED_NOW is 10 March 2026; Trash keeps tasks for 30 days.
  await expect(card).toContainText('Deleted 10/03/2026')
  await expect(card).toContainText('30 days left')
  await expect(card.getByRole('button', { name: 'Restore "Old errand"' })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Delete "Old errand" forever' })).toBeVisible()
})

test('the filter pills, search and "Show completed" still narrow the list', async ({ app, page }) => {
  await app.loadSampleData()
  const urgent = page.getByRole('button', { name: 'Urgent', exact: true })
  await urgent.click()
  await expect(urgent).toHaveAttribute('aria-pressed', 'true')
  await expect(app.taskRow('Renew car insurance')).toBeVisible()
  await expect(app.taskRow('Book dentist appointment')).toBeHidden()

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(urgent).toHaveAttribute('aria-pressed', 'false')

  await page.keyboard.press('/')
  await expect(page.getByLabel('Search tasks')).toBeFocused()
  await page.keyboard.type('no task is called this')
  await expect(page.getByRole('heading', { name: 'No matches' })).toBeVisible()
  await page.getByLabel('Search tasks').fill('')

  await expect(page.getByText(/^Show completed \(2\)$/)).toBeVisible()
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })

  test('the filter bar, the empty states and Trash fit without sideways scrolling', async ({ app, page }) => {
    expect(await app.scrollsSideways(), 'first-run empty state').toBe(false)
    await app.loadSampleData()
    expect(await app.scrollsSideways(), 'filter bar with every tag').toBe(false)

    await app.taskRow('Renew car insurance').getByRole('button').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Trash (1)' }).click()
    await expect(page.getByRole('list', { name: 'Trashed tasks' })).toBeVisible()
    expect(await app.scrollsSideways(), 'Trash').toBe(false)
  })
})
