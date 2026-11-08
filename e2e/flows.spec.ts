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
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(app.taskRow('Old errand')).toBeVisible()

  await deleteTask()
  await page.getByRole('button', { name: 'Trash (1)' }).click()
  await expect(page.getByRole('heading', { name: 'Trash' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await page.getByRole('button', { name: 'Back to tasks' }).click()
  await expect(app.taskRow('Old errand')).toBeVisible()
})

test('demo visitors can load sample data', async ({ app, page }) => {
  await page.getByRole('button', { name: 'load sample data' }).click()
  await expect(app.taskRow('Renew car insurance')).toContainText('Overdue')
  await expect(page.getByText('No tasks yet')).toBeHidden()
})
