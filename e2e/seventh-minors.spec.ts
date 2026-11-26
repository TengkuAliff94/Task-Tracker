// Step 37: the seventh critique's P3 (sample data loaded twice) and minors.
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

test('loading sample data again says it is already here, and Cancel adds nothing', async ({ app, page }) => {
  await app.loadSampleData()
  const before = await app.taskCards().count()
  // On phones Backup & restore sits under More; at the default width it's a header button.
  await page.getByRole('button', { name: /^Backup/ }).click()
  await page.getByRole('button', { name: 'Load sample data' }).click()
  const question = page.getByRole('alertdialog', { name: 'Sample tasks are already here' })
  await expect(question).toContainText('All 10 sample tasks are already in your list. Loading again adds a second copy of each.')
  await question.getByRole('button', { name: 'Cancel' }).click()
  await page.keyboard.press('Escape')
  await expect(app.taskCards()).toHaveCount(before)
})

test('with other tasks but no sample set, the old question stays', async ({ app, page }) => {
  await app.open()
  await app.quickAdd('Water plants')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /^Backup/ }).click()
  await page.getByRole('button', { name: 'Load sample data' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Add sample tasks?' })).toBeVisible()
})

test('with no results, Clear filters shows once: in the empty state', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await page.getByRole('button', { name: 'Urgent', exact: true }).click()
  await page.getByRole('button', { name: 'In Progress', exact: true }).click()
  await page.getByRole('button', { name: /^Filters/ }).click()
  await expect(page.getByText('No tasks match these filters.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(1)
  // The chips stay, so each filter can still come off on its own.
  await expect(page.locator('[data-chip]')).toHaveCount(2)
})

test('sample tags never share a near-identical colour', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  const dots = await page
    .getByRole('group', { name: 'Tags', exact: true })
    .locator('button span[aria-hidden]')
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor))
  expect(new Set(dots).size).toBe(dots.length)
  expect(dots).not.toContain('rgb(180, 70, 159)') // orchid, retired
})
