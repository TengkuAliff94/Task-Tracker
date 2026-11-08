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
  await page.getByRole('button', { name: 'Load sample data' }).click()
  await expect(app.taskRow('Renew car insurance')).toContainText('Overdue')
  await expect(page.getByText('No tasks yet')).toBeHidden()
})

test('loading sample data over existing tasks asks first, and Cancel changes nothing', async ({ app, page }) => {
  await app.quickAdd('My own task')
  await expect(app.taskRow('My own task')).toBeVisible()

  await page.getByRole('button', { name: 'Backup & restore' }).click()
  const dialog = page.getByRole('dialog', { name: 'Backup & restore' })

  let question = ''
  page.once('dialog', (d) => {
    question = d.message()
    void d.dismiss()
  })
  await dialog.getByRole('button', { name: 'Load sample data' }).click()
  await expect.poll(() => question).toContain('1 existing task')
  await expect(dialog.getByRole('button', { name: 'Load sample data' })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByText(/^1 task\b/)).toBeVisible()
  await expect(app.taskRow('Renew car insurance')).toHaveCount(0)

  await page.getByRole('button', { name: 'Backup & restore' }).click()
  page.once('dialog', (d) => d.accept())
  await dialog.getByRole('button', { name: 'Load sample data' }).click()
  await expect(dialog.getByText(/Added \d+ sample tasks/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(app.taskRow('My own task')).toBeVisible()
  await expect(app.taskRow('Renew car insurance')).toBeVisible()
})
