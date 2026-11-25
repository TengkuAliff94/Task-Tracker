// Restore replaces everything, so it gets the strongest safety net (fourth critique P2, #43): a
// download from inside the question, a warning when the file has fewer tasks, and Undo afterwards.
import { writeFileSync } from 'node:fs'
import type { Page, TestInfo } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const QUESTION = 'Replace everything with this backup?'

function backupFile(info: TestInfo, titles: string[]) {
  const file = info.outputPath('backup.json')
  const tasks = titles.map((title, i) => ({
    id: `restored-${i}`,
    title,
    description: '',
    status: 'todo',
    priority: 'medium',
    tagIds: [],
    checklist: [],
    reminders: [],
    createdAt: Date.parse('2026-03-01T09:00:00+08:00'),
  }))
  writeFileSync(file, JSON.stringify({ app: 'task-tracker', version: 1, exportedAt: '2026-03-08T09:00:00+08:00', tasks, projects: [], tags: [], attachments: [] }))
  return file
}

async function openBackup(page: Page) {
  await page.getByRole('button', { name: 'Backup & restore' }).click()
  return page.getByRole('dialog', { name: 'Backup & restore' })
}

/** Picks the file in Backup & restore and returns the question it raises. */
async function chooseFile(page: Page, file: string) {
  const dialog = await openBackup(page)
  const chooser = page.waitForEvent('filechooser')
  await dialog.getByRole('button', { name: 'Restore from file…' }).click()
  await (await chooser).setFiles(file)
  const question = page.getByRole('alertdialog', { name: QUESTION })
  await expect(question).toBeVisible()
  return { dialog, question }
}

test('the question can download what you have now, and stays open', async ({ app, page }, info) => {
  await app.loadSampleData()
  const { question } = await chooseFile(page, backupFile(info, ['From the file']))
  const download = page.waitForEvent('download')
  await question.getByRole('button', { name: 'Download current data' }).click()
  expect((await download).suggestedFilename()).toMatch(/^task-tracker-backup-\d{4}-\d{2}-\d{2}\.json$/)
  await expect(question).toBeVisible()
  await expect(question.getByRole('status')).toHaveText('Downloaded. You can replace everything now.')
  // Cancel still means nothing changed.
  await question.getByRole('button', { name: 'Cancel' }).click()
  await expect(question).toBeHidden()
})

test('the question warns when the backup has fewer tasks than you have now', async ({ app, page }, info) => {
  await app.loadSampleData()
  const { question } = await chooseFile(page, backupFile(info, ['From the file']))
  const now = Number((await question.getByRole('definition').first().textContent())!.match(/\d+/)![0])
  await expect(question.getByText(`This backup has ${now - 1} fewer tasks than you have now.`)).toBeVisible()
})

test('no fewer-tasks warning when the backup has as many or more', async ({ page }, info) => {
  await page.goto('/')
  const { question } = await chooseFile(page, backupFile(info, ['One', 'Two']))
  await expect(question.getByText(/fewer tasks? than you have now/)).toHaveCount(0)
})

test('Undo restore puts back every task and the last backup date', async ({ app, page }, info) => {
  await app.loadSampleData()
  const { dialog, question } = await chooseFile(page, backupFile(info, ['From the file']))
  const lastBackup = dialog.getByRole('definition').first()
  await expect(lastBackup).toHaveText('Never')
  await question.getByRole('button', { name: 'Replace everything' }).click()
  await expect(dialog.getByRole('status').filter({ hasText: 'Restored 1 task' })).toBeVisible()
  await expect(lastBackup).not.toHaveText('Never')

  await dialog.getByRole('button', { name: 'Undo restore' }).click()
  await expect(dialog.getByRole('status').filter({ hasText: 'Restore undone. Your tasks are back as they were.' })).toBeVisible()
  await expect(lastBackup).toHaveText('Never')
  await expect(dialog.getByRole('button', { name: 'Undo restore' })).toHaveCount(0)
  // The Undo button went; focus is back on Restore from file… rather than lost.
  await expect(dialog.getByRole('button', { name: 'Restore from file…' })).toBeFocused()

  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(app.taskRow('Pay rent')).toBeVisible()
  await expect(app.taskRow('From the file')).toHaveCount(0)
})

// Fifth critique P1 (#45): Undo restore outlives the window, for the rest of the session.

/** Restores the file and closes Backup & restore, returning the toast that takes over Undo. */
async function restoreAndClose(page: Page, file: string) {
  const { dialog, question } = await chooseFile(page, file)
  await question.getByRole('button', { name: /^Replace/ }).click()
  await expect(dialog.getByRole('status').filter({ hasText: 'Restored' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
  return page.getByRole('status').filter({ hasText: 'Backup restored' })
}

test('closing Backup & restore after a restore leaves a toast with Undo that stays', async ({ app, page }, info) => {
  await app.loadSampleData()
  const toast = await restoreAndClose(page, backupFile(info, ['From the file']))
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('You can undo it until you reload the app.')
  // Well past a normal toast's 6 seconds.
  await page.waitForTimeout(7000)
  await expect(toast).toBeVisible()

  await toast.getByRole('button', { name: 'Undo restore' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Restore undone' })).toBeVisible()
  await expect(app.taskRow('Pay rent')).toBeVisible()
  await expect(app.taskRow('From the file')).toHaveCount(0)
})

test('Undo after changes made since the restore asks first, and Cancel keeps them', async ({ app, page }, info) => {
  await app.loadSampleData()
  const toast = await restoreAndClose(page, backupFile(info, ['From the file']))
  await app.quickAdd('Added after the restore')
  await app.quickAddInput.blur()

  await toast.getByRole('button', { name: 'Undo restore' }).click()
  const ask = page.getByRole('alertdialog', { name: 'Undo the restore?' })
  await expect(ask).toContainText('Changes you’ve made since then will be lost too.')
  await expect(ask.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await ask.getByRole('button', { name: 'Cancel' }).click()
  await expect(app.taskRow('Added after the restore')).toBeVisible()
  // Called off, so Undo is still on offer.
  await expect(toast.getByRole('button', { name: 'Undo restore' })).toBeVisible()

  await toast.getByRole('button', { name: 'Undo restore' }).click()
  await ask.getByRole('button', { name: 'Undo restore' }).click()
  await expect(app.taskRow('Pay rent')).toBeVisible()
  await expect(app.taskRow('Added after the restore')).toHaveCount(0)
})

test('reopening Backup & restore still offers Undo restore, at full button size', async ({ app, page }, info) => {
  await app.loadSampleData()
  const toast = await restoreAndClose(page, backupFile(info, ['From the file']))
  await toast.getByRole('button', { name: 'Dismiss' }).click()
  const dialog = await openBackup(page)
  await expect(dialog.getByText('You restored a backup this session.')).toBeVisible()
  const undo = dialog.getByRole('button', { name: 'Undo restore' })
  expect((await undo.boundingBox())!.height).toBeGreaterThanOrEqual(36)
  await undo.click()
  await expect(dialog.getByRole('status').filter({ hasText: 'Restore undone.' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  // Nothing left to undo, so no toast takes over.
  await expect(page.getByRole('status').filter({ hasText: 'Backup restored' })).toHaveCount(0)
  await expect(app.taskRow('Pay rent')).toBeVisible()
})

test('a backup with no tasks gets its own question', async ({ app, page }, info) => {
  await app.loadSampleData()
  const dialog = await openBackup(page)
  const chooser = page.waitForEvent('filechooser')
  await dialog.getByRole('button', { name: 'Restore from file…' }).click()
  await (await chooser).setFiles(backupFile(info, []))
  const question = page.getByRole('alertdialog', { name: 'This backup has no tasks' })
  await expect(question).toBeVisible()
  await expect(question).toContainText(/Restoring it deletes all \d+ tasks you have now\./)
  await expect(question.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await expect(question.getByRole('button', { name: 'Replace with an empty backup' })).toBeVisible()
})
