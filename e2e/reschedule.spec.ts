// An overdue task has a quick way out (step 30, #53): Move by its card (Tomorrow, Next week, Pick a
// date…), the T key for the selected task, and a toast with Undo. At FIXED_NOW (Tue 10 Mar, 09:00)
// the sample set has two overdue tasks: "Renew car insurance" (2 days ago) and "Morning run" (today 07:00).
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const moveButton = (page: Page, title: string) => page.getByRole('button', { name: `Move “${title}” to…` })
const moveToast = (page: Page) => page.getByRole('status').filter({ hasText: / moved to / })

test('only overdue cards offer Move', async ({ app, page }) => {
  await app.loadSampleData()
  await expect(page.getByRole('button', { name: /^Move “/ })).toHaveCount(2)
  await expect(moveButton(page, 'Renew car insurance')).toBeVisible()
  await expect(moveButton(page, 'Pay rent')).toHaveCount(0)
})

test('Move → Tomorrow keeps the time, says where it went, and Undo puts it back', async ({ app, page }) => {
  await app.loadSampleData()
  await moveButton(page, 'Morning run').click()
  const menu = page.getByRole('menu', { name: 'Move “Morning run” to…' })
  await expect(menu.getByRole('menuitem')).toHaveText(['Tomorrow', 'Next week', 'Pick a date…'])
  await expect(menu.getByRole('menuitem', { name: 'Tomorrow' })).toBeFocused()
  await page.keyboard.press('Enter')

  const row = app.taskRow('Morning run')
  await expect(row).toContainText('Tomorrow 07:00')
  await expect(moveButton(page, 'Morning run')).toHaveCount(0)
  await expect(moveToast(page)).toContainText('“Morning run” moved to tomorrow')
  await expect(moveToast(page)).toContainText('Now due tomorrow 07:00')

  await moveToast(page).getByRole('button', { name: 'Undo' }).click()
  await expect(row).toContainText('Today 07:00')
  await expect(moveButton(page, 'Morning run')).toBeVisible()
})

test('Move → Next week is a week from today', async ({ app, page }) => {
  await app.loadSampleData()
  await moveButton(page, 'Renew car insurance').click()
  await page.getByRole('menuitem', { name: 'Next week' }).click()
  await expect(moveToast(page)).toContainText('Now due in 7 days')
  await expect(app.taskRow('Renew car insurance').locator('[data-overdue]')).toHaveCount(0)
})

test('Move → Pick a date… opens the editor at the deadline', async ({ app, page }) => {
  await app.loadSampleData()
  await moveButton(page, 'Renew car insurance').click()
  await page.getByRole('menuitem', { name: 'Pick a date…' }).click()
  const editor = page.getByRole('dialog', { name: 'Edit task' })
  await expect(editor).toBeVisible()
  await expect(editor.getByLabel('Deadline date')).toBeFocused()
})

test('T moves the selected task to tomorrow, and Z undoes it', async ({ app, page }) => {
  await app.loadSampleData()
  await app.taskRow('Morning run').locator('[data-card-edit]').focus()
  await page.keyboard.press('Tab') // onto Move…
  await page.keyboard.press('Shift+Tab') // …and back, so the card is selected the keyboard way
  await expect(app.taskRow('Morning run')).toHaveAttribute('aria-current', 'true')
  await page.keyboard.press('t')
  await expect(app.taskRow('Morning run')).toContainText('Tomorrow 07:00')
  await page.keyboard.press('z')
  await expect(app.taskRow('Morning run')).toContainText('Today 07:00')
})

test('the shortcuts sheet lists T', async ({ app, page }) => {
  void app
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: /shortcuts/i })).toContainText('Move selected task to tomorrow')
})

test('after a move, focus stays on the card, not the page (#53 review)', async ({ app, page }) => {
  await app.loadSampleData()
  await moveButton(page, 'Morning run').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Tomorrow' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(app.taskRow('Morning run')).toContainText('Tomorrow 07:00')
  await expect(app.taskRow('Morning run').locator('[data-card-edit]')).toBeFocused()
})

test('Pick a date… and Save hand focus back to the card', async ({ app, page }) => {
  await app.loadSampleData()
  await moveButton(page, 'Renew car insurance').click()
  await page.getByRole('menuitem', { name: 'Pick a date…' }).click()
  const editor = page.getByRole('dialog', { name: 'Edit task' })
  await editor.getByLabel('Deadline date').fill('20/03/2026')
  await editor.getByRole('button', { name: 'Save' }).click()
  await expect(editor).toBeHidden()
  await expect(app.taskRow('Renew car insurance').locator('[data-card-edit]')).toBeFocused()
})

test('T twice keeps the first move’s Undo, and another task’s move doesn’t take it', async ({ app, page }) => {
  await app.loadSampleData()
  await moveButton(page, 'Renew car insurance').click()
  await page.getByRole('menuitem', { name: 'Tomorrow' }).click()
  await app.taskRow('Morning run').locator('[data-card-edit]').focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('t')
  await page.keyboard.press('t')
  await expect(moveToast(page)).toHaveCount(2)
  await page.keyboard.press('z')
  await expect(app.taskRow('Morning run')).toContainText('Today 07:00')
  await moveToast(page).filter({ hasText: 'Renew car insurance' }).getByRole('button', { name: 'Undo' }).click()
  await expect(app.taskRow('Renew car insurance')).toContainText('2 days ago')
})
