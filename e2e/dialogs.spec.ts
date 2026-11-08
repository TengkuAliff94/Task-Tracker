// Dialogs and toasts: dialogs keep native <dialog> behaviour (Escape closes, focus returns to what
// opened them), and both dialogs and toasts animate in and out unless motion is reduced.
import type { Locator, Page } from '@playwright/test'
import { expect, isAnimating, test, type App } from './fixtures'

const opener = (page: Page, name: string) => page.getByRole('banner').getByRole('button', { name, exact: true })

for (const [button, dialogName] of [
  ['Keyboard shortcuts', 'Keyboard shortcuts'],
  ['New task', 'New task'],
  ['Projects & tags', 'Projects & tags'],
  ['Backup & restore', 'Backup & restore'],
] as const) {
  test(`closing the ${dialogName} dialog returns focus to the button that opened it`, async ({ app, page }) => {
    void app // opens the app
    const trigger = opener(page, button)
    const dialog = page.getByRole('dialog', { name: dialogName })

    await trigger.click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await dialog.getByRole('button', { name: 'Close' }).first().click()
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}

/** Whether `el` sits exactly where layout put it: no transform, or one that moves it nowhere. */
const isUntransformed = (el: Locator) =>
  el.evaluate((node) => {
    const t = getComputedStyle(node).transform
    return t === 'none' || new DOMMatrix(t).isIdentity
  })

/** Deletes a fresh task from its editor, which shows the "moved to Trash" toast with Undo. */
async function deleteATask(app: App, page: Page) {
  await app.quickAdd('Water the plants')
  await app.taskRow('Water the plants').getByRole('button').click()
  await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
  const toast = page.getByRole('status').filter({ hasText: 'moved to Trash' })
  await expect(toast).toBeVisible()
  return toast
}

test('a dialog springs in', async ({ app, page }) => {
  void app // opens the app
  await opener(page, 'Keyboard shortcuts').click()
  expect(await isAnimating(page.getByRole('dialog', { name: 'Keyboard shortcuts' }))).toBe(true)
})

test('a toast slides out after Undo instead of vanishing', async ({ app, page }) => {
  const toast = await deleteATask(app, page)
  await toast.getByRole('button', { name: 'Undo' }).click()
  // Read once, straight away: it is still on screen, on its way out.
  expect(await toast.isVisible()).toBe(true)
  await expect(toast).toBeHidden()
  await expect(app.taskRow('Water the plants')).toBeVisible()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a dialog appears without moving', async ({ app, page }) => {
    void app // opens the app
    await opener(page, 'Keyboard shortcuts').click()
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
    await expect(dialog).toBeVisible()
    expect(await isAnimating(dialog)).toBe(false)
  })

  test('a toast appears without moving and is gone at once after Undo', async ({ app, page }) => {
    const toast = await deleteATask(app, page)
    expect(await isAnimating(toast)).toBe(false)
    expect(await isUntransformed(toast)).toBe(true)
    await toast.getByRole('button', { name: 'Undo' }).click()
    await expect(toast).toBeHidden({ timeout: 750 })
  })
})
