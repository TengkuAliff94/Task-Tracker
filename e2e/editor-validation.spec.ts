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

  test('the deadline reads DD/MM/YYYY and 24-hour, in the field and the line under it', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    const date = dialog.getByLabel('Deadline date')
    const time = dialog.getByLabel('Deadline time')
    const readout = dialog.getByTestId('deadline-readout')
    await expect(readout).toHaveCount(0)
    // One format on screen: the fields are text, not the browser's mm/dd/yyyy and 12-hour pickers.
    await expect(date).toHaveAttribute('type', 'text')
    await expect(date).toHaveAttribute('placeholder', 'DD/MM/YYYY')
    await expect(time).toHaveAttribute('placeholder', 'HH:MM')
    await expect(time).toBeDisabled()

    await date.fill('11/03/2026')
    await expect(readout).toHaveText('Due Wed 11/03/2026 · Tomorrow')
    await time.fill('17:30')
    await expect(readout).toHaveText('Due Wed 11/03/2026, 17:30 · Tomorrow')
    await expect(date).toHaveAccessibleDescription('Due Wed 11/03/2026, 17:30 · Tomorrow')

    await date.fill('25/04/2026')
    await expect(readout).toHaveText('Due Sat 25/04/2026, 17:30')
  })

  test('a short or spelled-out deadline is written back as DD/MM/YYYY and 24-hour on leaving the field', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    const date = dialog.getByLabel('Deadline date')
    const time = dialog.getByLabel('Deadline time')
    const readout = dialog.getByTestId('deadline-readout')

    await date.fill('25/4')
    await expect(readout).toHaveText('Due Sat 25/04/2026')
    await date.press('Tab')
    await expect(date).toHaveValue('25/04/2026')

    await time.fill('5:30pm')
    await time.press('Tab')
    await expect(time).toHaveValue('17:30')

    // Words read as in quick add, and a time given with them fills the time field rather than vanishing.
    await date.fill('fri 9am')
    await expect(readout).toHaveText('Due Fri 13/03/2026, 09:00 · In 3 days')
    await date.press('Tab')
    await expect(date).toHaveValue('13/03/2026')
    await expect(time).toHaveValue('09:00')
  })

  test('the calendar button fills the field in DD/MM/YYYY', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    const button = dialog.getByRole('button', { name: 'Open calendar for the deadline' })
    await expect(button).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Open time picker for the deadline' })).toBeDisabled()
    await button.click()
    // What the browser's picker writes on a choice. The picker itself is browser chrome Playwright can't drive.
    await dialog.locator('input[type="date"]').first().fill('2026-04-25', { force: true })
    await expect(dialog.getByLabel('Deadline date')).toHaveValue('25/04/2026')
    await expect(dialog.getByRole('button', { name: 'Open time picker for the deadline' })).toBeEnabled()
  })

  test('a reminder time reads DD/MM/YYYY and 24-hour before it is added', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    await dialog.getByLabel('Add reminder').selectOption('absolute')
    await dialog.getByLabel('Reminder date').fill('12/3')
    await dialog.getByLabel('Reminder time').fill('1905')
    await expect(dialog.getByText('Reminds you Thu 12/03/2026, 19:05')).toBeVisible()
    // Enter adds it, as Add does, instead of submitting the form.
    await dialog.getByLabel('Reminder time').press('Enter')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('12/03/2026, 19:05', { exact: true })).toBeVisible()
    await expect(dialog.getByLabel('Reminder date')).toHaveCount(0)
  })

  test('a reminder date given with a time is split between the two fields on leaving', async ({ app, page }) => {
    void app
    const dialog = await openNewTask(page)
    await dialog.getByLabel('Add reminder').selectOption('absolute')
    const date = dialog.getByLabel('Reminder date')
    await date.fill('fri 9am')
    await expect(dialog.getByText('Reminds you Fri 13/03/2026, 09:00')).toBeVisible()
    await date.press('Tab')
    await expect(date).toHaveValue('13/03/2026')
    await expect(dialog.getByLabel('Reminder time')).toHaveValue('09:00')
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
  await dialog.getByLabel('Reminder date').fill('12/03/2026')
  await dialog.getByLabel('Reminder time').fill('19:05')
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
  await date.fill('15/03/202')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(date).toBeFocused()
  await expect(date).toHaveAccessibleDescription('Use DD/MM/YYYY, such as 08/03/2026, or clear it.')
  await expect(date).toHaveValue('15/03/202')
  await expect(dialog).toBeVisible()

  await date.fill('15/03/2026')
  await expect(date).not.toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByTestId('deadline-readout')).toHaveText('Due Sun 15/03/2026 · In 5 days')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()
  await expect(app.taskRow('Pay the water bill')).toContainText('In 5 days')
})

test('a date or time that does not exist is named in the error, and the text is kept', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Renew the licence')
  const date = dialog.getByLabel('Deadline date')
  const time = dialog.getByLabel('Deadline time')
  await date.fill('31/02/2026')
  await time.fill('25:00')
  // Leaving the field leaves text it can't read as it was.
  await date.press('Tab')
  await expect(date).toHaveValue('31/02/2026')
  await expect(dialog.getByTestId('deadline-readout')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(date).toBeFocused()
  await expect(date).toHaveAccessibleDescription('“31/02/2026” isn’t a date. Check the day and month.')
  await expect(time).toHaveAccessibleDescription('“25:00” isn’t a time. Hours go up to 23 and minutes up to 59.')

  await date.fill('28/02/2027')
  await expect(date).not.toHaveAttribute('aria-invalid', 'true')
  await time.fill('23:00')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()
})

test('a date with a 24-hour time after it saves that time, not a year', async ({ app, page }) => {
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Pick up the parcel')
  await dialog.getByLabel('Deadline date').fill('12/3 0930')
  await expect(dialog.getByTestId('deadline-readout')).toHaveText('Due Thu 12/03/2026, 09:30 · In 2 days')
  // Enter saves without leaving the field first.
  await dialog.getByLabel('Deadline date').press('Enter')
  await expect(dialog).toBeHidden()
  await openTask(app, page, 'Pick up the parcel')
  await expect(editEditor(page).getByLabel('Deadline date')).toHaveValue('12/03/2026')
  await expect(editEditor(page).getByLabel('Deadline time')).toHaveValue('09:30')
})

test('the date and time fields say their format to a screen reader until there is a reading', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await expect(dialog.getByLabel('Deadline date')).toHaveAccessibleDescription('Day first, such as 25/04/2026. Words like “fri” also work.')
  await expect(dialog.getByLabel('Deadline time')).toHaveAccessibleDescription('24-hour clock, such as 17:30.')
  await dialog.getByLabel('Add reminder').selectOption('absolute')
  const reminderDate = dialog.getByLabel('Reminder date')
  await expect(reminderDate).toHaveAccessibleDescription('Day first, such as 25/04/2026. Words like “fri” also work.')
  await reminderDate.fill('fri 9am')
  await expect(reminderDate).toHaveAccessibleDescription('Reminds you Fri 13/03/2026, 09:00')
})

test('the reminder date and time share a row where they fit, each with its error under it', async ({ app, page }) => {
  void app
  await page.setViewportSize({ width: 1280, height: 900 })
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Renew the licence')
  await dialog.getByLabel('Add reminder').selectOption('absolute')
  const date = dialog.getByLabel('Reminder date')
  const time = dialog.getByLabel('Reminder time')
  await date.fill('31/02/2026')
  await dialog.getByRole('button', { name: 'Add task' }).click()

  const dateBox = (await date.boundingBox())!
  const timeBox = (await time.boundingBox())!
  expect(timeBox.y).toBe(dateBox.y)
  expect(timeBox.x).toBeGreaterThan(dateBox.x + dateBox.width)
  // Each error starts under its own field, not under the pair.
  const dateError = (await dialog.getByText('“31/02/2026” isn’t a date.', { exact: false }).boundingBox())!
  const timeError = (await dialog.getByText('Give the reminder a time, such as 09:00.').boundingBox())!
  expect(dateError.x).toBeLessThan(dateBox.x + dateBox.width)
  expect(timeError.x).toBeGreaterThanOrEqual(timeBox.x)
  expect(dateError.y).toBeGreaterThan(dateBox.y + dateBox.height - 1)
})

test('clearing the date takes the error off the time field it disables', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Renew the licence')
  await dialog.getByLabel('Deadline date').fill('12/03/2026')
  const time = dialog.getByLabel('Deadline time')
  await time.fill('25:99')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(time).toHaveAttribute('aria-invalid', 'true')
  await dialog.getByLabel('Deadline date').fill('')
  await expect(time).toBeDisabled()
  await expect(time).not.toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByText('“25:99” isn’t a time.', { exact: false })).toHaveCount(0)
})

test('a half-typed reminder time stops Save instead of being dropped', async ({ app, page }) => {
  await app.quickAdd('Water the plants')
  const dialog = await openTask(app, page, 'Water the plants')
  await dialog.getByLabel('Add reminder').selectOption('absolute')
  await dialog.getByLabel('Reminder date').fill('12/03/2026')
  await expect(dialog.getByRole('button', { name: 'Add', exact: true })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Save' }).click()

  const time = dialog.getByLabel('Reminder time')
  await expect(time).toBeFocused()
  await expect(time).toHaveAccessibleDescription('Give the reminder a time, such as 09:00.')
  await expect(dialog).toBeVisible()

  await time.fill('7pm')
  await expect(time).not.toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByText('Reminds you Thu 12/03/2026, 19:00')).toBeVisible()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await openTask(app, page, 'Water the plants')
  await expect(dialog.getByText('12/03/2026, 19:00', { exact: true })).toBeVisible()
})

test('clearing the date after half-typing a time still lets the task save, without a deadline', async ({ app, page }) => {
  void app
  const dialog = await openNewTask(page)
  await dialog.getByLabel('Title').fill('Call the bank')
  await dialog.getByLabel('Deadline date').fill('12/03/2026')
  await dialog.getByLabel('Deadline time').fill('5:')
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
