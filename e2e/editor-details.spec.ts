// The task editor leads with what most tasks need (title, deadline, priority, description, checklist,
// project, tags). Status, effort, repeat, reminders and attachments wait behind "More details", which
// starts closed and says what's set behind it, so nothing is out of sight.
import type { Page } from '@playwright/test'
import { expect, test, type App, openMoreDetails } from './fixtures'

const editor = (page: Page) => page.getByRole('dialog', { name: 'Edit task' })
const toggleIn = (page: Page) => editor(page).getByRole('button', { name: /^More details/ })

async function openTask(app: App, page: Page, line: string, title: string) {
  await app.quickAdd(line)
  // Quick add keeps focus, and on phones its panel shrinks on leaving, which would move the card mid-tap.
  await app.quickAddInput.blur()
  await app.taskRow(title).getByRole('button', { name: new RegExp(`^${title}`) }).click()
  await expect(editor(page)).toBeVisible()
  return editor(page)
}

test('a new task shows the main fields, with the rest behind a closed More details that names them', async ({ app, page }) => {
  void app
  await page.getByRole('button', { name: 'New task' }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await expect(dialog).toBeVisible()

  for (const name of ['Title', 'Deadline date', 'Deadline time', 'Priority', 'Description', 'New checklist item', 'Project', 'Add tag']) {
    await expect(dialog.getByLabel(name, { exact: true })).toBeVisible()
  }
  const toggle = dialog.getByRole('button', { name: /^More details/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toContainText('Status, effort, repeat, reminders, attachments')
  for (const name of ['Status', 'Effort', 'Repeat', 'Add reminder', 'Add link']) {
    await expect(dialog.getByLabel(name, { exact: true })).toBeHidden()
  }

  // Deadline and priority come before the description, reading down the form.
  const deadline = (await dialog.getByLabel('Deadline date').boundingBox())!
  const description = (await dialog.getByLabel('Description').boundingBox())!
  expect(deadline.y).toBeLessThan(description.y)

  // The toggle points at what it shows, and the keyboard works it.
  const panelId = await toggle.getAttribute('aria-controls')
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(dialog.locator(`[id="${panelId}"]`)).toBeVisible()
  for (const name of ['Status', 'Effort', 'Repeat', 'Add reminder', 'Add link']) {
    await expect(dialog.getByLabel(name, { exact: true })).toBeVisible()
  }
})

test('closed, More details says what is set behind it', async ({ app, page }) => {
  const dialog = await openTask(app, page, 'Water the plants ~30m tomorrow', 'Water the plants')
  const toggle = toggleIn(page)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toHaveAccessibleName('More details 30m')

  await openMoreDetails(dialog)
  await dialog.getByLabel('Status').selectOption({ label: 'In Progress' })
  await dialog.getByLabel('Repeat').selectOption({ label: 'Weekly' })
  await dialog.getByLabel('Add reminder').selectOption({ label: 'At deadline' })
  await toggle.click()
  await expect(toggle).toHaveAccessibleName('More details In Progress · 30m · Repeats weekly · 1 reminder')
})

test('a problem behind a closed More details opens it and takes focus', async ({ app, page }) => {
  const dialog = await openTask(app, page, 'Water the plants', 'Water the plants')
  await openMoreDetails(dialog)
  await dialog.getByLabel('Effort').fill('a while')
  await toggleIn(page).click()
  await expect(dialog.getByLabel('Effort')).toBeHidden()

  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(toggleIn(page)).toHaveAttribute('aria-expanded', 'true')
  await expect(dialog.getByLabel('Effort')).toBeFocused()
  await expect(dialog.getByLabel('Effort')).toHaveAccessibleDescription('Effort should look like 30m, 2h or 1h30m.')
})

test('text typed behind a closed More details is still saved', async ({ app, page }) => {
  const dialog = await openTask(app, page, 'Water the plants', 'Water the plants')
  await openMoreDetails(dialog)
  await dialog.getByLabel('Add link').fill('example.com/plants')
  await toggleIn(page).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()

  await app.taskRow('Water the plants').getByRole('button', { name: /^Water the plants/ }).click()
  await expect(toggleIn(page)).toHaveAccessibleName('More details 1 attachment')
})

test.describe('on the narrowest phone', () => {
  test.use({ viewport: { width: 320, height: 1000 } })

  test('the open details fit without sideways scrolling, and Status shows its whole word', async ({ app, page }) => {
    const dialog = await openTask(app, page, 'Water the plants', 'Water the plants')
    await openMoreDetails(dialog)
    await dialog.getByLabel('Status').selectOption({ label: 'In Progress' })
    expect(await app.scrollsSideways()).toBe(false)
    const status = dialog.getByLabel('Status')
    const fits = await status.evaluate((el) => el.scrollWidth <= el.clientWidth)
    expect(fits).toBe(true)
    const statusBox = (await status.boundingBox())!
    const effortBox = (await dialog.getByLabel('Effort').boundingBox())!
    // Stacked rather than squeezed side by side.
    expect(effortBox.y).toBeGreaterThan(statusBox.y)
  })
})
