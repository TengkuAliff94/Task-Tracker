import { expect, test } from './fixtures'

// The fixture pins "now" to Tuesday 10 March 2026, so today is 2026-03-10 and a week later is 2026-03-17.
test('completing a weekly task creates next week’s copy, and unticking removes it', async ({ app, page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  const form = page.getByRole('dialog', { name: 'New task' })
  await form.getByLabel('Title').fill('Water plants')
  await form.getByLabel('Deadline date').fill('2026-03-10')
  await form.getByLabel('Repeat').selectOption({ label: 'Weekly' })
  await form.getByRole('button', { name: 'Add task' }).click()
  await expect(form).toBeHidden()

  const row = app.taskRow('Water plants')
  await expect(row).toContainText('Today')
  await expect(row.getByRole('img', { name: 'Repeats' })).toBeVisible()

  // Ticking it done hides the original and puts an open copy, due a week later, in its place.
  await page.getByRole('checkbox', { name: 'Mark "Water plants" as done' }).click()
  await expect(page.getByText('Show completed (1)')).toBeVisible()
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('In 7 days')
  await expect(row).not.toContainText('Today')
  await expect(row.getByRole('img', { name: 'Repeats' })).toBeVisible()

  await row.getByRole('button').click()
  const edit = page.getByRole('dialog', { name: 'Edit task' })
  await expect(edit.getByLabel('Deadline date')).toHaveValue('2026-03-17')
  await expect(edit.getByLabel('Repeat')).toHaveValue('week-1')
  await edit.getByRole('button', { name: 'Close' }).click()
  await expect(edit).toBeHidden()

  // Unticking the original undoes the completion, so the copy it made goes away.
  await page.getByText('Show completed (1)').click()
  await page.getByRole('checkbox', { name: 'Mark "Water plants" as not done' }).click()
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Today')
  await expect(row).not.toContainText('In 7 days')
  await expect(page.getByRole('checkbox', { name: 'Mark "Water plants" as done' })).toBeVisible()
})
