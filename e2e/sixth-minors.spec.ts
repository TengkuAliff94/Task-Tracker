// The sixth critique's P3 and minor observations (step 32, #55): Trash
// says "Empty Trash" both times, the effort in More details is worded, Undo restore stands apart from a
// bad-file error, a bare "#" isn't a task, the empty Trash line wraps evenly, and the page makes room
// to scroll the last cards clear of the toasts.
import { writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const header = (page: Page) => page.getByRole('banner')

test('Trash’s button and its question both say “Empty Trash”', async ({ app, page }) => {
  await app.quickAdd('Old errand')
  await app.taskRow('Old errand').locator('[data-card-edit]').click()
  await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
  await header(page).getByRole('button', { name: /^Trash/ }).click()
  await expect(page.getByRole('button', { name: 'Empty Trash', exact: true })).toBeVisible()
})

test('a bare “#” is not a task', async ({ app }) => {
  await app.quickAddInput.fill('#')
  await app.quickAddInput.press('Enter')
  await expect(app.page.getByRole('alert')).toContainText('Add a title')
  await expect(app.page.getByText('No tasks yet')).toBeVisible()
})

test('the empty Trash line wraps evenly', async ({ app, page }) => {
  void app
  await header(page).getByRole('button', { name: /^Trash/ }).click()
  await expect(page.getByText(/Deleted tasks wait here for 30 days/)).toHaveCSS('text-wrap-style', 'balance')
})

test('after a bad file, Undo restore stands apart with its own reason', async ({ app, page }, info) => {
  await app.loadSampleData()
  const good = info.outputPath('good.json')
  writeFileSync(
    good,
    JSON.stringify({ app: 'task-tracker', version: 1, exportedAt: '2026-03-08T09:00:00+08:00', tasks: [{ id: 'r', title: 'From the file', description: '', status: 'todo', priority: 'medium', tagIds: [], checklist: [], reminders: [], createdAt: 1 }], projects: [], tags: [], attachments: [] }),
  )
  const bad = info.outputPath('bad.json')
  writeFileSync(bad, JSON.stringify({ hello: 'world' }))
  await page.getByRole('button', { name: 'Backup & restore' }).click()
  const dialog = page.getByRole('dialog', { name: 'Backup & restore' })
  const pick = async (file: string) => {
    const chooser = page.waitForEvent('filechooser')
    await dialog.getByRole('button', { name: 'Restore from file…' }).click()
    await (await chooser).setFiles(file)
  }
  await pick(good)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Replace everything' }).click()
  await expect(dialog.getByRole('button', { name: 'Undo restore' })).toBeVisible()
  await pick(bad)
  const error = dialog.getByRole('status').filter({ hasText: 'isn’t a Task Tracker backup' })
  await expect(error).toBeVisible()
  // The error is its own line; Undo restore sits under its own reason, not beside the error.
  await expect(error.getByRole('button')).toHaveCount(0)
  await expect(dialog.getByText('You restored a backup this session. Undo puts back what was here before.')).toBeVisible()
  const errorBox = (await error.boundingBox())!
  const undoBox = (await dialog.getByRole('button', { name: 'Undo restore' }).boundingBox())!
  expect(undoBox.y).toBeGreaterThan(errorBox.y + errorBox.height)
})

test('the page leaves room to scroll the last cards clear of the toasts', async ({ app, page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await app.loadSampleData()
  await app.quickAdd('Make room')
  await app.taskRow('Make room').locator('input[type="checkbox"]').click()
  await expect(page.getByRole('status').filter({ hasText: 'Done: Make room' })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  const stack = (await page.getByRole('region', { name: 'Notifications' }).boundingBox())!
  const cards = page.locator('[data-task-id]')
  const last = (await cards.last().boundingBox())!
  expect(last.y + last.height).toBeLessThanOrEqual(stack.y)
})
