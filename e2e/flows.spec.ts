import { expect, test, type Page } from '@playwright/test'

const row = (page: Page, title: string) => page.locator('li[data-task-id]').filter({ hasText: title })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('No tasks yet')).toBeVisible()
})

test('quick-add turns tokens into a fully filled-in task', async ({ page }) => {
  const input = page.getByLabel('Quick add task')
  await input.fill('Pay rent #finance @home !high ~30m tomorrow 5pm')
  await input.press('Enter')

  await expect(input).toHaveValue('')
  const task = row(page, 'Pay rent')
  await expect(task).toBeVisible()
  await expect(task).toContainText('High')
  await expect(task).toContainText('Tomorrow 17:00')
  await expect(task).toContainText('@home')
  await expect(task).toContainText('#finance')
  await expect(task).toContainText('30m')

  // The new project and tag show up as filter options.
  await expect(page.getByLabel('Filter by project')).toContainText('home')
})

test('create, edit and complete a task', async ({ page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  const form = page.getByRole('dialog', { name: 'New task' })
  await form.getByLabel('Title').fill('Write report')
  await form.getByLabel('Priority').selectOption('urgent')
  await form.getByRole('button', { name: 'Add task' }).click()
  await expect(form).toBeHidden()
  await expect(row(page, 'Write report')).toContainText('Urgent')

  await row(page, 'Write report').getByRole('button').click()
  const edit = page.getByRole('dialog', { name: 'Edit task' })
  await edit.getByLabel('Title').fill('Write quarterly report')
  await edit.getByLabel('Status').selectOption('in_progress')
  await edit.getByRole('button', { name: 'Save' }).click()
  await expect(row(page, 'Write quarterly report')).toContainText('In Progress')

  await page.getByLabel('Mark "Write quarterly report" as done').click()
  await expect(row(page, 'Write quarterly report')).toBeHidden()
  await page.getByText('Show completed (1)').click()
  await expect(row(page, 'Write quarterly report')).toBeVisible()
})

test('delete with undo, then restore from Trash', async ({ page }) => {
  const input = page.getByLabel('Quick add task')
  await input.fill('Old errand')
  await input.press('Enter')

  const deleteTask = async () => {
    await row(page, 'Old errand').getByRole('button').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await expect(row(page, 'Old errand')).toBeHidden()
  }

  await deleteTask()
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(row(page, 'Old errand')).toBeVisible()

  await deleteTask()
  await page.getByRole('button', { name: 'Trash (1)' }).click()
  await expect(page.getByRole('heading', { name: 'Trash' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await page.getByRole('button', { name: 'Back to tasks' }).click()
  await expect(row(page, 'Old errand')).toBeVisible()
})

test('demo visitors can load sample data', async ({ page }) => {
  await page.getByRole('button', { name: 'load sample data' }).click()
  await expect(row(page, 'Renew car insurance')).toContainText('Overdue')
  await expect(page.getByText('No tasks yet')).toBeHidden()
})
