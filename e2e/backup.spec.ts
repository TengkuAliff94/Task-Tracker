// Data safety around backups (#25): the backup reminder counts real use, not sample data; the app asks
// the browser to keep its storage and says what it answered; sample data sits apart from Restore.
import { writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** Reloads, as a later visit would, and waits for the app to be back (the header is there even with no tasks). */
async function revisit(page: Page) {
  await page.reload()
  await expect(page.getByRole('button', { name: 'Backup & restore' })).toBeVisible()
}

test.describe('the backup reminder', () => {
  test('never comes up for sample data on a fresh install, however old its tasks look', async ({ app, page }) => {
    await app.loadSampleData()
    await expect(app.backupNudge).toHaveCount(0)

    await page.clock.fastForward(10 * DAY)
    await revisit(page)
    await expect(app.taskRow('Renew car insurance')).toBeVisible()
    await expect(app.backupNudge).toHaveCount(0)
  })

  test('comes up 3 days after the first task of your own', async ({ app, page }) => {
    await app.loadSampleData()
    await page.clock.fastForward(5 * DAY) // sample data first; the count must not start from it
    await app.quickAdd('My own task')

    await page.clock.fastForward(3 * DAY - HOUR)
    await revisit(page)
    await expect(app.taskRow('My own task')).toBeVisible()
    await expect(app.backupNudge).toHaveCount(0)

    await page.clock.fastForward(2 * HOUR)
    await revisit(page)
    await expect(page.getByRole('status').filter({ hasText: 'You haven’t backed up your tasks yet.' })).toBeVisible()
  })
})

/**
 * Stands in for the browser's storage manager, which headless Chromium answers on its own terms.
 * `window.__grants` is what persist() answers, `window.__permission` what a permission query says,
 * and `window.__persistCalls` counts requests. Each page load starts unprotected.
 */
async function fakeStorageManager(page: Page, { grants = true, permission = 'prompt' } = {}) {
  await page.addInitScript(
    ({ grants, permission }) => {
      const w = window as unknown as { __grants: boolean; __permission: string; __persistCalls: number }
      w.__grants = grants
      w.__permission = permission
      w.__persistCalls = 0
      let kept = false
      StorageManager.prototype.persisted = async () => kept
      StorageManager.prototype.persist = async () => {
        w.__persistCalls++
        kept = kept || w.__grants
        return kept
      }
      const query = Permissions.prototype.query
      Permissions.prototype.query = function (desc) {
        if (desc.name === ('persistent-storage' as PermissionName)) return Promise.resolve({ state: w.__permission } as PermissionStatus)
        return query.call(this, desc)
      }
    },
    { grants, permission },
  )
  await revisit(page)
}

const persistCalls = (page: Page) => page.evaluate(() => (window as unknown as { __persistCalls: number }).__persistCalls)

async function openBackup(page: Page) {
  await page.getByRole('button', { name: 'Backup & restore' }).click()
  return page.getByRole('dialog', { name: 'Backup & restore' })
}

test.describe('keeping storage', () => {
  test('the first task of your own asks the browser to keep storage; sample data does not', async ({ app, page }) => {
    await fakeStorageManager(page)
    await app.loadSampleData()
    expect(await persistCalls(page)).toBe(0)

    await app.quickAdd('My own task')
    await expect.poll(() => persistCalls(page)).toBe(1)
    const dialog = await openBackup(page)
    await expect(dialog.getByRole('definition').filter({ hasText: 'Protected' })).toContainText(
      'The browser won’t clear your tasks to free up space.',
    )
  })

  test('later visits ask again only when the browser would agree without a prompt', async ({ app, page }) => {
    await fakeStorageManager(page, { grants: false })
    await app.quickAdd('My own task')
    await expect.poll(() => persistCalls(page)).toBe(1)

    await revisit(page)
    await expect(app.taskRow('My own task')).toBeVisible()
    await page.waitForTimeout(300) // long enough for the launch check to have run, if it was going to
    expect(await persistCalls(page), 'no prompt on page load').toBe(0)

    await page.addInitScript(() => {
      ;(window as unknown as { __permission: string }).__permission = 'granted'
    })
    await revisit(page)
    await expect.poll(() => persistCalls(page)).toBe(1)
  })

  test('the Backup window says when storage isn’t protected, and can ask', async ({ app, page }) => {
    void app // opens the app first
    await fakeStorageManager(page, { grants: false })
    const dialog = await openBackup(page)
    const storage = dialog.getByRole('definition').filter({ hasText: 'protected' })
    await expect(storage).toContainText('Not protected')
    await expect(storage).toContainText('The browser may clear your tasks if the device runs low on space.')

    await storage.getByRole('button', { name: 'Ask the browser to protect it' }).click()
    await expect(storage).toContainText('Not granted.')
    const again = storage.getByRole('button', { name: 'Ask again' })
    await expect(again).toBeFocused()

    // A second refusal still changes the line, so it doesn't look as if nothing happened.
    await again.click()
    await expect(storage).toContainText('Still not granted.')
    await expect(again).toBeFocused()

    await page.evaluate(() => {
      ;(window as unknown as { __grants: boolean }).__grants = true
    })
    await again.click()
    await expect(storage).toContainText('Protected')
    await expect(storage.getByRole('button')).toHaveCount(0)
    await expect(storage.getByText('Protected', { exact: true }), 'focus moves to the answer, not to the page').toBeFocused()
  })

  test('an open Backup window catches up when a restore gets storage protected', async ({ app, page }, info) => {
    void app
    await fakeStorageManager(page, { grants: true })
    const file = info.outputPath('backup.json')
    const task = {
      id: 'restored-1',
      title: 'From the file',
      description: '',
      status: 'todo',
      priority: 'medium',
      tagIds: [],
      checklist: [],
      reminders: [],
      createdAt: Date.parse('2026-03-01T09:00:00+08:00'),
    }
    const backupFile = { app: 'task-tracker', version: 1, exportedAt: '2026-03-08T09:00:00+08:00', tasks: [task], projects: [], tags: [], attachments: [] }
    writeFileSync(file, JSON.stringify(backupFile))

    const dialog = await openBackup(page)
    const storage = dialog.getByRole('definition').filter({ hasText: 'protected' })
    await expect(storage).toContainText('Not protected')
    const chooser = page.waitForEvent('filechooser')
    await dialog.getByRole('button', { name: 'Restore from file…' }).click()
    await (await chooser).setFiles(file)
    await page.getByRole('alertdialog', { name: 'Replace everything with this backup?' }).getByRole('button', { name: 'Replace everything' }).click()
    await expect(dialog.getByRole('status').filter({ hasText: 'Restored 1 task' })).toBeVisible()

    // The restore counts as first use, so the app asked; the window shows the new answer without reopening.
    await expect(storage).toContainText('Protected')
    await expect(storage).not.toContainText('Not protected')
    // ...and the file is now the last backup.
    await expect(dialog.getByRole('definition').first()).toHaveText('Sun 08/03/2026, 09:00')
  })

  test('a browser that doesn’t report storage protection is described honestly', async ({ app, page }) => {
    void app // opens the app first
    await page.addInitScript(() => {
      // @ts-expect-error: removing what an older browser wouldn't have
      delete StorageManager.prototype.persisted
    })
    await revisit(page)
    const dialog = await openBackup(page)
    await expect(dialog.getByRole('definition').filter({ hasText: 'Not reported' })).toContainText(
      'This browser doesn’t say whether it keeps your tasks when space runs low.',
    )
  })
})

test('Backup & restore keeps sample data apart from Restore, and shows the last backup as DD/MM/YYYY', async ({ app, page }) => {
  await app.quickAdd('My own task')
  const dialog = await openBackup(page)
  const tryIt = dialog.getByRole('region', { name: 'Try the app' })
  await expect(tryIt.getByRole('button', { name: 'Load sample data' })).toBeVisible()
  await expect(tryIt.getByRole('button', { name: 'Restore from file…' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Restore from file…' })).toBeVisible()

  // The result lines are live regions that exist before any message, so the first one is announced.
  await expect(dialog.getByRole('status')).toHaveCount(2)
  await expect(dialog.getByRole('status').first()).toBeEmpty()

  const last = dialog.getByRole('definition').first()
  await expect(last).toHaveText('Never')
  await dialog.getByRole('button', { name: 'Download backup' }).click()
  await expect(dialog.getByRole('status').filter({ hasText: 'Backup downloaded.' })).toBeVisible()
  await expect(last).toHaveText(/^Tue 10\/03\/2026, 09:0\d$/)
})
