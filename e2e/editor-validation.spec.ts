// The task editor checks its own fields: problems show under the field in the app's words (never
// the browser's "Please fill out this field." bubble), dates read DD/MM/YYYY and 24-hour whatever the
// browser's locale, and text typed into an "add" field but not added is saved rather than dropped.
import type { Page } from '@playwright/test'
import { expect, test, type App } from './fixtures'

const newTaskEditor = (page: Page) => page.getByRole('dialog', { name: 'New task' })
const editEditor = (page: Page) => page.getByRole('dialog', { name: 'Edit task' })

async function openNewTask(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'New task' }).click()
  await expect(newTaskEditor(page)).toBeVisible()
  return newTaskEditor(page)
}

async function openTask(app: App, page: Page, title: string) {
  await app.taskRow(title).getByRole('button').first().click()
  await expect(editEditor(page)).toBeVisible()
  return editEditor(page)
}

for (const [what, typed] of [
  ['an empty title', ''],
  ['a title of only spaces', '   '],
] as const) {
  test(`${what} shows the app's own error under the field and keeps the editor open`, async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    const title = dialog.getByLabel('Title')
    await title.fill(typed)
    await dialog.getByLabel('Priority').focus()
    await dialog.getByRole('button', { name: 'Add task' }).click()

    const error = dialog.getByRole('alert').filter({ hasText: 'Give the task a title.' })
    await expect(error).toBeVisible()
    await expect(title).toBeFocused()
    await expect(title).toHaveAttribute('aria-invalid', 'true')
    // Read through aria-describedby, so a screen reader hears it with the field.
    await expect(title).toHaveAccessibleDescription('Give the task a title.')
    // The browser didn't block the submit to show its own bubble: the form doesn't validate natively.
    expect(await dialog.locator('form').evaluate((f: HTMLFormElement) => f.noValidate)).toBe(true)

    await title.fill('Water the plants')
    await expect(error).toBeHidden()
    await expect(title).not.toHaveAttribute('aria-invalid', 'true')
    await dialog.getByRole('button', { name: 'Add task' }).click()
    await expect(dialog).toBeHidden()
    await expect(app.taskRow('Water the plants')).toBeVisible()
  })
}

test('an effort that does not parse is flagged at the Effort field', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Paint the fence')
  await dialog.getByLabel('Effort').fill('a while')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog.getByLabel('Effort')).toBeFocused()
  await expect(dialog.getByLabel('Effort')).toHaveAccessibleDescription('Effort should look like 30m, 2h or 1h30m.')
  await expect(dialog).toBeVisible()
})

test.describe('in an en-US browser', () => {
  test.use({ locale: 'en-US' })

  test('the deadline still reads DD/MM/YYYY and 24-hour beside the pickers', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    const readout = dialog.getByTestId('deadline-readout')
    await expect(readout).toHaveCount(0)

    await dialog.getByLabel('Deadline date').fill('2026-03-11')
    await expect(readout).toHaveText('Due Wed 11/03/2026 · Tomorrow')
    await dialog.getByLabel('Deadline time').fill('17:30')
    await expect(readout).toHaveText('Due Wed 11/03/2026, 17:30 · Tomorrow')
    await expect(dialog.getByLabel('Deadline date')).toHaveAccessibleDescription('Due Wed 11/03/2026, 17:30 · Tomorrow')

    await dialog.getByLabel('Deadline date').fill('2026-04-25')
    await expect(readout).toHaveText('Due Sat 25/04/2026, 17:30')
  })

  test('a reminder time reads DD/MM/YYYY and 24-hour before it is added', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    await dialog.getByLabel('Add reminder').selectOption('absolute')
    await dialog.getByLabel('Reminder time').fill('2026-03-12T19:05')
    await expect(dialog.getByText('Reminds you Thu 12/03/2026, 19:05')).toBeVisible()
  })
})

test('Save adds what was typed into each "add" field instead of dropping it', async ({ app, page }) => {
  await app.quickAdd('Water the plants')
  const dialog = await openTask(app, page, 'Water the plants')

  await dialog.getByLabel('New checklist item').fill('Fill the watering can')
  await dialog.getByLabel('Add link').fill('example.com/plants')
  await dialog.getByLabel('Add tag').fill('garden')
  await dialog.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'No project' }) }).selectOption('__new__')
  await dialog.getByLabel('New project name').fill('Balcony')
  await dialog.getByLabel('Add reminder').selectOption('absolute')
  await dialog.getByLabel('Reminder time').fill('2026-03-12T19:05')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()

  const row = app.taskRow('Water the plants')
  await expect(row).toContainText('#garden')
  await expect(row).toContainText('Balcony')

  await openTask(app, page, 'Water the plants')
  await expect(dialog.getByLabel('Checklist item', { exact: true })).toHaveValue('Fill the watering can')
  await expect(dialog.getByRole('link', { name: 'https://example.com/plants' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Remove garden' })).toBeVisible()
  await expect(dialog.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'Balcony' }) })).toHaveValue(/.+/)
  await expect(dialog.getByText('12/03/2026, 19:05')).toBeVisible()
  // Nothing is left over to discard: closing is instant.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a new project name that already exists reuses that project on Save', async ({ app, page }) => {
  await app.loadSampleData()
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Book a plumber')
  await dialog.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'No project' }) }).selectOption('__new__')
  await dialog.getByLabel('New project name').fill('home')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()
  await expect(app.taskRow('Book a plumber')).toContainText('Home')
})

test('a typed link that is not valid stops Save and says why at the link field', async ({ app, page }) => {
  await app.quickAdd('Water the plants')
  const dialog = await openTask(app, page, 'Water the plants')
  await dialog.getByLabel('New checklist item').fill('Fill the watering can')
  await dialog.getByLabel('Add link').fill('ftp://example.com/plants')
  await dialog.getByRole('button', { name: 'Save' }).click()

  const link = dialog.getByLabel('Add link')
  await expect(link).toBeFocused()
  await expect(link).toHaveAccessibleDescription('Only http and https links are allowed')
  await expect(link).toHaveValue('ftp://example.com/plants')
  // Nothing was half-saved: the checklist text is still waiting in its field.
  await expect(dialog.getByLabel('New checklist item')).toHaveValue('Fill the watering can')

  await link.fill('https://example.com/plants')
  await expect(link).not.toHaveAttribute('aria-invalid', 'true')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
})

test('a half-typed deadline is flagged instead of quietly saving no deadline', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Pay the water bill')
  const date = dialog.getByLabel('Deadline date')
  // Day and month only: the input's value stays empty, which used to save without a deadline.
  await date.click()
  await page.keyboard.type('1503')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(date).toBeFocused()
  await expect(date).toHaveAccessibleDescription('Finish the date, or clear it.')
  await expect(dialog).toBeVisible()

  await date.fill('2026-03-15')
  await expect(date).not.toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByTestId('deadline-readout')).toHaveText('Due Sun 15/03/2026 · In 5 days')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()
  await expect(app.taskRow('Pay the water bill')).toContainText('In 5 days')
})

test('clearing the date after half-typing a time still lets the task save, without a deadline', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Call the bank')
  await dialog.getByLabel('Deadline date').fill('2026-03-12')
  await dialog.getByLabel('Deadline time').click()
  await page.keyboard.type('05')
  await dialog.getByLabel('Deadline date').fill('')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()
  await expect(app.taskRow('Call the bank')).toBeVisible()
})

test('the first field with an error is focused clear of the sticky title bar and footer', async ({ app, page }) => {
  void app
  await page.setViewportSize({ width: 390, height: 640 })
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Paint the fence')
  await dialog.getByLabel('Effort').fill('a while')
  // Scroll so the Effort field sits just under the sticky title bar: on screen as far as the browser
  // knows, so focusing it wouldn't scroll at all without a scroll margin.
  await dialog.evaluate((d) => {
    const input = d.querySelector<HTMLElement>('[aria-label="Effort"]')!
    d.scrollTop += input.getBoundingClientRect().top - d.getBoundingClientRect().top - 12
  })
  await dialog.getByRole('button', { name: 'Add task' }).click()
  const effort = dialog.getByLabel('Effort')
  await expect(effort).toBeFocused()
  const titleBar = (await dialog.getByRole('heading', { name: 'New task' }).locator('..').boundingBox())!
  const label = (await dialog.getByText('Effort', { exact: true }).boundingBox())!
  const field = (await effort.boundingBox())!
  const footer = (await dialog.getByRole('button', { name: 'Add task' }).locator('../..').boundingBox())!
  // The field and its label both show below the title bar, and the field ends above the footer.
  expect(label.y).toBeGreaterThanOrEqual(titleBar.y + titleBar.height)
  expect(field.y + field.height).toBeLessThanOrEqual(footer.y)
})

test('the Project menu has a name', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await expect(dialog.getByRole('combobox', { name: 'Project', exact: true })).toHaveValue('')
})
