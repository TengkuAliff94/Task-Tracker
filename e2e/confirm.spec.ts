// Confirmations happen inside the app, never in the browser's own confirm box: each one shows the
// counts first, Cancel is the safe default for anything destructive, and Esc cancels.
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

// Any native dialog (confirm, alert, prompt) fails the test that opened it.
let nativeDialogs: string[] = []
test.beforeEach(({ page }) => {
  nativeDialogs = []
  page.on('dialog', (d) => {
    nativeDialogs.push(`${d.type()}: ${d.message()}`)
    void d.dismiss()
  })
})
test.afterEach(() => {
  expect(nativeDialogs).toEqual([])
})

/** Picks a file through the Restore button, the way a person would. */
async function restoreFrom(page: Page, file: string) {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('dialog', { name: 'Backup & restore' }).getByRole('button', { name: 'Restore from file…' }).click()
  await (await chooser).setFiles(file)
}

const question = (page: Page, name: string) => page.getByRole('alertdialog', { name })

/** Deletes tasks from their editors, so they're in Trash. */
async function trash(page: Page, titles: string[]) {
  for (const title of titles) {
    await page
      .getByRole('list', { name: /tasks$/i })
      .getByRole('listitem')
      .filter({ hasText: title })
      .getByRole('button')
      .first()
      .click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeHidden()
  }
}

async function openTrash(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: /^Trash/ }).click()
  await expect(page.getByRole('list', { name: 'Trashed tasks' })).toBeVisible()
}

test('restoring a backup shows both counts, defaults to Cancel, and Esc keeps everything', async ({ app, page }, info) => {
  await app.quickAdd('Kept in the backup')
  await page.getByRole('button', { name: 'Backup & restore' }).click()
  const backupDialog = page.getByRole('dialog', { name: 'Backup & restore' })
  const download = page.waitForEvent('download')
  await backupDialog.getByRole('button', { name: 'Download backup' }).click()
  const file = info.outputPath('backup.json')
  await (await download).saveAs(file)
  await backupDialog.getByRole('button', { name: 'Close' }).click()

  await app.quickAdd('Added after the backup')
  await app.quickAdd('Also added after')
  await page.getByRole('button', { name: 'Backup & restore' }).click()
  await restoreFrom(page, file)

  const ask = question(page, 'Replace everything with this backup?')
  await expect(ask).toBeVisible()
  await expect(ask.locator('dt')).toHaveText(['Now', 'Backup'])
  await expect(ask.locator('dd')).toHaveText(['3 tasks, including any in Trash', '1 task, 0 attachments'])
  await expect(ask).toContainText('Your current data will be lost.')
  await expect(ask.getByRole('button', { name: 'Cancel' })).toBeFocused()

  // Esc closes only the question; the Backup & restore window stays open behind it.
  await page.keyboard.press('Escape')
  await expect(ask).toBeHidden()
  await expect(backupDialog).toBeVisible()
  await expect(backupDialog.getByRole('button', { name: 'Restore from file…' })).toBeFocused()
  await backupDialog.getByRole('button', { name: 'Close' }).click()
  await expect(app.taskRow('Added after the backup')).toBeVisible()

  await page.getByRole('button', { name: 'Backup & restore' }).click()
  await restoreFrom(page, file)
  await ask.getByRole('button', { name: 'Replace everything' }).click()
  await expect(backupDialog.getByText('Restored 1 task and 0 attachments.')).toBeVisible()
  await backupDialog.getByRole('button', { name: 'Close' }).click()
  await expect(app.taskRow('Kept in the backup')).toBeVisible()
  await expect(app.taskRow('Added after the backup')).toHaveCount(0)
})

test('a file that is not a backup is turned away before anyone is asked to replace anything', async ({ app, page }, info) => {
  await app.quickAdd('Still here')
  const file = info.outputPath('not-a-backup.json')
  await writeFile(file, JSON.stringify({ hello: 'world' }))
  await page.getByRole('button', { name: 'Backup & restore' }).click()
  const backupDialog = page.getByRole('dialog', { name: 'Backup & restore' })
  await restoreFrom(page, file)
  await expect(backupDialog.getByText(/This isn't a valid Task Tracker backup/)).toBeVisible()
  await expect(question(page, 'Replace everything with this backup?')).toHaveCount(0)
  await backupDialog.getByRole('button', { name: 'Close' }).click()
  await expect(app.taskRow('Still here')).toBeVisible()
})

test('Empty trash says how many tasks go for good, and Cancel keeps them', async ({ app, page }) => {
  for (const t of ['First old task', 'Second old task']) await app.quickAdd(t)
  await trash(page, ['First old task', 'Second old task'])
  await openTrash(page)

  await page.getByRole('button', { name: 'Empty trash' }).click()
  const ask = question(page, 'Empty Trash?')
  await expect(ask).toContainText('This permanently deletes 2 tasks and their attachments. It can’t be undone.')
  await expect(ask.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await ask.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('list', { name: 'Trashed tasks' }).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Empty trash' })).toBeFocused()

  await page.getByRole('button', { name: 'Empty trash' }).click()
  await ask.getByRole('button', { name: 'Delete forever' }).click()
  await expect(page.getByText('Nothing in Trash')).toBeVisible()
})

test('Delete forever names the task, and focus moves to the next card after', async ({ app, page }) => {
  for (const t of ['Alpha errand', 'Beta errand', 'Gamma errand']) await app.quickAdd(t)
  await trash(page, ['Alpha errand', 'Beta errand', 'Gamma errand'])
  await openTrash(page)
  const cards = page.getByRole('list', { name: 'Trashed tasks' }).getByRole('listitem')
  const first = await cards.first().textContent()
  const second = await cards.nth(1).textContent()
  const firstTitle = ['Alpha errand', 'Beta errand', 'Gamma errand'].find((t) => first?.includes(t))!
  const secondTitle = ['Alpha errand', 'Beta errand', 'Gamma errand'].find((t) => second?.includes(t))!

  await page.getByRole('button', { name: `Delete "${firstTitle}" forever` }).click()
  const ask = question(page, 'Delete this task forever?')
  await expect(ask).toContainText(`“${firstTitle}” and its attachments will be deleted for good.`)
  await expect(ask.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await ask.getByRole('button', { name: 'Delete forever' }).click()

  await expect(cards).toHaveCount(2)
  await expect(page.getByRole('button', { name: `Delete "${secondTitle}" forever` })).toBeFocused()
})

test('deleting a project says how many tasks move, Esc cancels, and focus stays in the window', async ({ app, page }) => {
  await app.loadSampleData()
  await page.getByRole('button', { name: 'Projects & tags' }).click()
  const manager = page.getByRole('dialog', { name: 'Projects & tags' })
  const deleteButtons = manager.getByRole('button', { name: /^Delete / })
  const firstDelete = deleteButtons.first()
  const name = (await firstDelete.getAttribute('aria-label'))!.replace(/^Delete /, '')

  await firstDelete.click()
  const ask = question(page, 'Delete this project?')
  await expect(ask).toContainText(new RegExp(`“${name}” will be deleted\\. (\\d+ tasks? will move to “No project”|No tasks use it)\\.`))
  await expect(ask.getByRole('button', { name: 'Cancel' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(ask).toBeHidden()
  await expect(manager).toBeVisible()
  await expect(firstDelete).toBeFocused()

  await firstDelete.click()
  await ask.getByRole('button', { name: 'Delete project' }).click()
  await expect(manager.getByRole('button', { name: `Delete ${name}`, exact: true })).toHaveCount(0)
  await expect(manager).toBeVisible()
  // Focus moves to the next row's Delete button rather than falling out of the window.
  await expect(manager.getByRole('button', { name: /^Delete / }).first()).toBeFocused()
})
