// The final polish pass (#39): the Trash slot, quick-add preview chips, the solid dialog title bar,
// and Save on the editor's discard bar. (The lone Clear filters is covered in overview.spec.ts.)
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const banner = (page: Page) => page.getByRole('banner')

test.describe('Trash header', () => {
  for (const width of [390, 1280]) {
    test(`Back to tasks fills New task's slot, and the tray stays put (${width})`, async ({ app, page }) => {
      await page.setViewportSize({ width, height: 800 })
      await app.loadSampleData()
      const trash = banner(page).getByRole('button', { name: /^Trash/ })
      const before = await trash.boundingBox()
      const newTask = await banner(page).getByRole('button', { name: 'New task' }).boundingBox()

      await trash.click()
      const back = banner(page).getByRole('button', { name: 'Back to tasks' })
      await expect(back).toBeVisible()
      await expect(back, 'one named control, not the arrow as well').toHaveCount(1)
      // In New task's place, at the header's right, where the hand already is.
      const b = await back.boundingBox()
      expect(Math.abs(b!.x + b!.width - (newTask!.x + newTask!.width))).toBeLessThan(1)
      const after = await trash.boundingBox()
      expect(Math.abs(after!.x - before!.x), 'the Trash button stays under the pointer').toBeLessThan(1)

      await back.click()
      await expect(page.getByRole('heading', { level: 1, name: 'Tasks' })).toBeVisible()
      await expect(banner(page).getByRole('button', { name: 'New task' })).toBeVisible()
    })
  }
})

test('the quick-add preview shows an existing label in its colours, a new one plain', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByLabel('Quick add task').fill('Buy stamps #errand #post @home')
  const preview = page.getByRole('group', { name: 'Quick add preview' })
  // Two known labels (Home, errand) show their colour dot; "#post" is new and stays plain.
  await expect(preview.locator('span.rounded-full')).toHaveCount(2)
  await expect(preview).toContainText('@Home') // the project's saved spelling
  await expect(preview).toContainText('#errand')
  await expect(preview.getByText('#post', { exact: true })).toBeVisible()
})

test('dialog title bars are solid, so nothing shows through them', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByRole('list', { name: /tasks$/i }).getByRole('listitem').filter({ hasText: 'Pay rent' }).locator('[data-card-edit]').click()
  const bar = page.getByRole('dialog', { name: 'Edit task' }).getByRole('heading', { name: 'Edit task' }).locator('..')
  const style = await bar.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, blur: getComputedStyle(el).backdropFilter }))
  expect(style.bg).toMatch(/^rgb\(/) // opaque: no alpha channel
  expect(style.blur).toBe('none')
})

test.describe('discard bar', () => {
  async function editAndClose(page: Page) {
    await page.getByRole('list', { name: /tasks$/i }).getByRole('listitem').filter({ hasText: 'Pay rent' }).locator('[data-card-edit]').click()
    const editor = page.getByRole('dialog', { name: 'Edit task' })
    await editor.getByLabel('Title').fill('Pay rent and water bill')
    await page.keyboard.press('Escape')
    return editor
  }

  test('Save on the bar saves and closes, and Keep editing keeps focus', async ({ app, page }) => {
    await app.loadSampleData()
    const editor = await editAndClose(page)
    const bar = editor.getByRole('group', { name: 'Discard your changes?' })
    await expect(bar.getByRole('button', { name: 'Keep editing' })).toBeFocused()

    await bar.getByRole('button', { name: 'Save' }).click()
    await expect(editor).toBeHidden()
    await expect(app.taskRow('Pay rent and water bill')).toBeVisible()
  })

  test('Save on the bar with a problem shows it at the field instead of closing', async ({ app, page }) => {
    await app.loadSampleData()
    const editor = await editAndClose(page)
    // Back to the form, empty the title, then ask to close again.
    await editor.getByRole('button', { name: 'Keep editing' }).click()
    await editor.getByLabel('Title').fill('')
    await page.keyboard.press('Escape')
    await editor.getByRole('group', { name: 'Discard your changes?' }).getByRole('button', { name: 'Save' }).click()

    await expect(editor).toBeVisible()
    await expect(editor.getByLabel('Title')).toBeFocused()
    await expect(editor.getByLabel('Title')).toHaveAccessibleDescription('Give the task a title.')
  })
})
