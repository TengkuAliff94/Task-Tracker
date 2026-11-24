// The task editor never throws edits away silently. With nothing changed, every way out closes it
// at once; with unsaved changes, each one asks "Discard your changes?" first, inside the dialog.
import type { Locator, Page } from '@playwright/test'
import { expect, isAnimating, test, type App } from './fixtures'

const editor = (page: Page) => page.getByRole('dialog', { name: 'Edit task' })
const discardBar = (dialog: Locator) => dialog.getByRole('group', { name: /^Discard/ })

/** Adds a task and opens it in the editor. */
async function openTask(app: App, page: Page, title = 'Water the plants') {
  await app.quickAdd(title)
  await app.taskRow(title).getByRole('button').click()
  await expect(editor(page)).toBeVisible()
  return editor(page)
}

const closePaths = {
  Esc: (dialog: Locator) => dialog.page().keyboard.press('Escape'),
  '×': (dialog: Locator) => dialog.getByRole('button', { name: 'Close' }).click(),
  Cancel: (dialog: Locator) => dialog.getByRole('button', { name: 'Cancel' }).click(),
}

for (const [path, closeVia] of Object.entries(closePaths)) {
  test(`with nothing changed, ${path} closes the editor at once`, async ({ app, page }) => {
    const dialog = await openTask(app, page)
    await closeVia(dialog)
    await expect(dialog).toBeHidden()
  })

  test(`with unsaved changes, ${path} asks first, and Keep editing keeps them`, async ({ app, page }) => {
    const dialog = await openTask(app, page)
    await dialog.getByLabel('Title').fill('Water the tomatoes')
    await dialog.getByLabel('Priority').selectOption('high')
    await closeVia(dialog)

    const bar = discardBar(dialog)
    await expect(bar).toContainText('Discard your changes?')
    await expect(dialog).toBeVisible()
    await expect(bar.getByRole('button', { name: 'Keep editing' })).toBeFocused()

    await bar.getByRole('button', { name: 'Keep editing' }).click()
    await expect(bar).toBeHidden()
    await expect(dialog.getByLabel('Title')).toHaveValue('Water the tomatoes')
    await expect(dialog.getByLabel('Priority')).toHaveValue('high')
    // Focus goes back to where it was: the field last typed in for Esc, the button pressed otherwise.
    const backTo = {
      Esc: dialog.getByLabel('Title'),
      '×': dialog.getByRole('button', { name: 'Close' }),
      Cancel: dialog.getByRole('button', { name: 'Cancel' }),
    }[path]!
    await expect(backTo).toBeFocused()
  })

  test(`with unsaved changes, ${path} then Discard closes and keeps the saved task`, async ({ app, page }) => {
    const dialog = await openTask(app, page)
    await dialog.getByLabel('Title').fill('Water the tomatoes')
    await closeVia(dialog)
    await discardBar(dialog).getByRole('button', { name: 'Discard' }).click()
    await expect(dialog).toBeHidden()
    await expect(app.taskRow('Water the plants')).toBeVisible()
    await expect(app.taskRow('Water the tomatoes')).toBeHidden()
  })
}

test('pressing Esc again on the question keeps editing instead of closing', async ({ app, page }) => {
  const dialog = await openTask(app, page)
  await dialog.getByLabel('Title').fill('Water the tomatoes')
  await page.keyboard.press('Escape')
  await expect(discardBar(dialog)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(discardBar(dialog)).toBeHidden()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Title')).toBeFocused()
  await expect(dialog.getByLabel('Title')).toHaveValue('Water the tomatoes')
})

test('changing a field back to how it was counts as no change', async ({ app, page }) => {
  const dialog = await openTask(app, page)
  await dialog.getByLabel('Title').fill('Water the tomatoes')
  await dialog.getByLabel('Title').fill('Water the plants')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a staged attachment and text not yet added both count as unsaved', async ({ app, page }) => {
  let dialog = await openTask(app, page)
  await dialog.getByLabel('Add link').fill('example.com')
  await dialog.getByLabel('Add link').press('Enter')
  await expect(dialog.getByText('unsaved')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(discardBar(dialog)).toBeVisible()
  await discardBar(dialog).getByRole('button', { name: 'Discard' }).click()
  await expect(dialog).toBeHidden()

  await app.taskRow('Water the plants').getByRole('button').click()
  dialog = editor(page)
  await expect(dialog.getByText('example.com')).toBeHidden()
  await dialog.getByLabel('New checklist item').fill('Fill the watering can')
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(discardBar(dialog)).toBeVisible()
})

test('a reminder time picked but not yet added counts as unsaved', async ({ app, page }) => {
  const dialog = await openTask(app, page)
  await dialog.getByLabel('Add reminder').selectOption({ label: 'At a specific time…' })
  await dialog.getByLabel('Reminder date').fill('01/12/2026')
  await page.keyboard.press('Escape')
  await expect(discardBar(dialog)).toBeVisible()
})

test.describe('a close the browser forces anyway', () => {
  // Stands in for a close request the page isn't allowed to cancel, e.g. a second Android back gesture.
  const forceClose = (dialog: Locator) => dialog.evaluate((el: HTMLDialogElement) => el.close())

  test('reopens the editor with the question showing and focus in it', async ({ app, page }) => {
    const dialog = await openTask(app, page)
    await dialog.getByLabel('Title').fill('Water the tomatoes')
    await forceClose(dialog)
    await expect(discardBar(dialog)).toBeVisible()
    await expect(discardBar(dialog).getByRole('button', { name: 'Keep editing' })).toBeFocused()
    await expect(dialog.getByLabel('Title')).toHaveValue('Water the tomatoes')
  })

  test('with the question already showing, focus still goes back into it', async ({ app, page }) => {
    const dialog = await openTask(app, page)
    await dialog.getByLabel('Title').fill('Water the tomatoes')
    await page.keyboard.press('Escape')
    await expect(discardBar(dialog)).toBeVisible()
    await forceClose(dialog)
    await expect(dialog).toBeVisible()
    await expect(discardBar(dialog).getByRole('button', { name: 'Keep editing' })).toBeFocused()
  })
})

test.describe('when attachments fail to save', () => {
  test.beforeEach(async ({ page }) => {
    // Storage refuses attachments (as when the device is full) until the test lets them through.
    await page.addInitScript(() => {
      const w = window as unknown as { failAttachments: boolean }
      w.failAttachments = true
      const add = IDBObjectStore.prototype.add
      IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
        if (this.name === 'attachments' && w.failAttachments) throw new DOMException('Full', 'QuotaExceededError')
        return add.apply(this, args)
      }
    })
  })

  test('a new task is saved once, says so, and retrying adds no copy', async ({ app, page }) => {
    void app
    await page.getByRole('button', { name: 'New task' }).click()
    const dialog = page.getByRole('dialog', { name: 'New task' })
    await dialog.getByLabel('Title').fill('Book the dentist')
    await dialog.getByLabel('Add link').fill('example.com')
    await dialog.getByLabel('Add link').press('Enter')
    await dialog.getByRole('button', { name: 'Add task' }).click()

    await expect(dialog.getByRole('alert')).toContainText('The task is saved, but its attachment changes aren’t.')
    await expect(dialog.getByRole('alert')).toContainText('There isn’t enough storage space')
    await expect(app.taskCards()).toHaveCount(1)

    // Only the attachment is unsaved now, and the question says so.
    await page.keyboard.press('Escape')
    await expect(discardBar(dialog)).toContainText('Discard your changes?')
    await discardBar(dialog).getByRole('button', { name: 'Keep editing' }).click()

    await page.evaluate(() => ((window as unknown as { failAttachments: boolean }).failAttachments = false))
    await dialog.getByRole('button', { name: 'Add task' }).click()
    await expect(dialog).toBeHidden()
    await expect(app.taskCards()).toHaveCount(1)
  })
})

test('on a narrow phone the question stays on one line and the buttons wrap below', async ({ app, page }) => {
  void app
  await page.setViewportSize({ width: 320, height: 700 })
  await page.getByRole('button', { name: 'New task' }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByLabel('Title').fill('Book the dentist')
  await page.keyboard.press('Escape')
  const question = discardBar(dialog).getByText('Discard this new task?')
  const { height } = await question.evaluate((el) => el.getBoundingClientRect())
  expect(height, 'one 20px line').toBeLessThanOrEqual(21)
})

test('going back to a field puts the question away', async ({ app, page }) => {
  const dialog = await openTask(app, page)
  await dialog.getByLabel('Title').fill('Water the tomatoes')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(discardBar(dialog)).toBeVisible()
  await dialog.getByLabel('Description').click()
  await expect(discardBar(dialog)).toBeHidden()
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible()
})

test('a new task with a title asks before it is thrown away', async ({ app, page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByLabel('Title').fill('Book the dentist')
  await page.keyboard.press('Escape')
  await expect(discardBar(dialog)).toContainText('Discard this new task?')
  await discardBar(dialog).getByRole('button', { name: 'Discard' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('No tasks yet')).toBeVisible()
  void app
})

test('saving still closes straight away', async ({ app, page }) => {
  const dialog = await openTask(app, page)
  await dialog.getByLabel('Title').fill('Water the tomatoes')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await expect(app.taskRow('Water the tomatoes')).toBeVisible()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the question appears without moving', async ({ app, page }) => {
    const dialog = await openTask(app, page)
    await dialog.getByLabel('Title').fill('Water the tomatoes')
    await page.keyboard.press('Escape')
    const bar = discardBar(dialog)
    await expect(bar).toBeVisible({ timeout: 750 })
    expect(await isAnimating(bar)).toBe(false)
    await expect(bar.getByRole('button', { name: 'Keep editing' })).toBeFocused()
  })
})
