import { expect, test } from './fixtures'

test('quick-add parses tokens, shows the task and keeps it after a reload', async ({ app, page }) => {
  await app.quickAddInput.fill('Pay rent #finance @home !high ~30m tomorrow 5pm')

  const preview = app.quickAddPreview
  await expect(preview).toContainText('Pay rent')
  await expect(preview.getByText('@home', { exact: true })).toBeVisible()
  await expect(preview.getByText('#finance', { exact: true })).toBeVisible()
  await expect(preview.getByText('High', { exact: true })).toBeVisible()
  await expect(preview.getByText('~30m', { exact: true })).toBeVisible()
  await expect(preview.getByText('Tomorrow 17:00', { exact: true })).toBeVisible()

  await app.quickAddInput.press('Enter')
  await expect(app.quickAddInput).toHaveValue('')
  await expect(preview).toBeHidden()

  const expectRow = async () => {
    const row = app.taskRow('Pay rent')
    await expect(row).toBeVisible()
    await expect(row.getByText('High', { exact: true })).toBeVisible()
    await expect(row.getByText('@home')).toBeVisible()
    await expect(row.getByText('#finance')).toBeVisible()
    await expect(row.getByText('30m', { exact: true })).toBeVisible()
    await expect(row.getByText('Tomorrow 17:00', { exact: true })).toBeVisible()
  }
  await expectRow()
  // The new project shows up as a filter option.
  await expect(page.getByLabel('Filter by project')).toContainText('home')

  // A reload drops all in-memory state, so the task can only come back from IndexedDB.
  await page.reload()
  await expectRow()
})
