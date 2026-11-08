import { expect, test } from './fixtures'

test('create, edit and complete a task', async ({ app, page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  const form = page.getByRole('dialog', { name: 'New task' })
  await form.getByLabel('Title').fill('Write report')
  await form.getByLabel('Priority').selectOption('urgent')
  await form.getByRole('button', { name: 'Add task' }).click()
  await expect(form).toBeHidden()
  await expect(app.taskRow('Write report')).toContainText('Urgent')

  await app.taskRow('Write report').getByRole('button').click()
  const edit = page.getByRole('dialog', { name: 'Edit task' })
  await edit.getByLabel('Title').fill('Write quarterly report')
  await edit.getByLabel('Status').selectOption('in_progress')
  await edit.getByRole('button', { name: 'Save' }).click()
  await expect(app.taskRow('Write quarterly report')).toContainText('In Progress')

  await page.getByLabel('Mark "Write quarterly report" as done').click()
  await expect(app.taskRow('Write quarterly report')).toBeHidden()
  await page.getByText('Show completed (1)').click()
  await expect(app.taskRow('Write quarterly report')).toBeVisible()
})

test('delete with undo, then restore from Trash', async ({ app, page }) => {
  await app.quickAdd('Old errand')

  const deleteTask = async () => {
    await app.taskRow('Old errand').getByRole('button').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await expect(app.taskRow('Old errand')).toBeHidden()
  }

  await deleteTask()
  const toast = page.getByRole('status').filter({ hasText: '“Old errand” moved to Trash' })
  await expect(toast).toBeVisible()
  await toast.getByRole('button', { name: 'Undo' }).click()
  await expect(toast).toBeHidden()
  await expect(app.taskRow('Old errand')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trash (0)' })).toBeVisible()

  await deleteTask()
  await page.getByRole('button', { name: 'Trash (1)' }).click()
  await expect(page.getByRole('heading', { name: 'Trash' })).toBeVisible()
  // The clock is pinned (see fixtures.ts), so it was deleted today with the full 30 days to go.
  const trashed = page.getByRole('list', { name: 'Trashed tasks' }).getByRole('listitem').filter({ hasText: 'Old errand' })
  await expect(trashed).toContainText('Deleted 10/03/2026')
  await expect(trashed).toContainText('30 days left')

  await trashed.getByRole('button', { name: 'Restore "Old errand"' }).click()
  await expect(page.getByText('Trash is empty.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trash (0)' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to tasks' }).click()
  await expect(app.taskRow('Old errand')).toBeVisible()
})

test('demo visitors can load sample data', async ({ app, page }) => {
  await page.getByRole('button', { name: 'load sample data' }).click()
  await expect(app.taskRow('Renew car insurance')).toContainText('Overdue')
  await expect(page.getByText('No tasks yet')).toBeHidden()
})
