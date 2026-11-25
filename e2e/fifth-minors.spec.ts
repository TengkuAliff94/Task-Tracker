// The fifth critique's minor observations (step 27, #50): Trash says things once and has fewer ways
// back, the tray holds still when the Trash count appears, restore lines drop zero counts and turn
// bad files away in plain words, grouped cards don't repeat their project, overdue is one red, the
// discard bar's Save stands apart from Discard, and touch screens don't get a keyboard hint.
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

async function tokenColour(page: Page, name: string) {
  return page.evaluate((v) => {
    const probe = document.createElement('span')
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(v)
    document.body.append(probe)
    const out = getComputedStyle(probe).color
    probe.remove()
    return out
  }, name)
}

const header = (page: Page) => page.getByRole('banner')
const backupDialog = (page: Page) => page.getByRole('dialog', { name: 'Backup & restore' })

async function restoreFrom(page: Page, file: string) {
  const chooser = page.waitForEvent('filechooser')
  await backupDialog(page).getByRole('button', { name: 'Restore from file…' }).click()
  await (await chooser).setFiles(file)
}

test('empty Trash says it once, and the title has no second way back', async ({ app, page }) => {
  void app
  await header(page).getByRole('button', { name: /^Trash/ }).click()
  await expect(page.getByRole('heading', { name: 'Nothing in Trash' })).toBeVisible()
  await expect(page.getByText('Trash is empty.')).toHaveCount(0)
  await expect(page.getByText(/Deleted tasks wait here for 30 days/)).toBeVisible()
  // Back to tasks (and the pressed Trash button) remain; the pointer-only arrow by the title is gone.
  await expect(header(page).locator('button[aria-hidden="true"]')).toHaveCount(0)
  await expect(header(page).getByRole('button', { name: 'Back to tasks' })).toBeVisible()
})

for (const width of [768, 1280]) {
  test(`the tray holds still when the Trash count appears (${width}px)`, async ({ app, page }) => {
    await page.setViewportSize({ width, height: 800 })
    await app.loadSampleData()
    const trash = header(page).getByRole('button', { name: /^Trash/ })
    const before = await trash.boundingBox()
    await app.taskRow('Grocery run').locator('[data-card-edit]').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(trash).toHaveAccessibleName('Trash (1)')
    const after = await trash.boundingBox()
    expect(after!.width).toBe(before!.width)
    expect(after!.x).toBe(before!.x)
  })
}

test('a restore with no attachments doesn’t mention them', async ({ app, page }, info) => {
  await app.quickAdd('Kept in the backup')
  await header(page).getByRole('button', { name: 'Backup & restore' }).click()
  const download = page.waitForEvent('download')
  await backupDialog(page).getByRole('button', { name: 'Download backup' }).click()
  const file = info.outputPath('backup.json')
  await (await download).saveAs(file)
  await restoreFrom(page, file)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Replace everything' }).click()
  const line = backupDialog(page).getByRole('status').filter({ hasText: 'Restored' })
  await expect(line).toHaveText('Restored 1 task.')
  // The success line is ink, not the brand orange: colour has one job.
  const colour = await line.evaluate((e) => getComputedStyle(e).color)
  expect(colour).not.toBe(await tokenColour(page, '--primary'))
  expect(colour).toBe(await tokenColour(page, '--fg'))
})

test('a file that isn’t a backup is turned away in plain words, with what to do', async ({ app, page }, info) => {
  void app
  const file = info.outputPath('not-a-backup.json')
  await writeFile(file, JSON.stringify({ hello: 'world' }))
  await header(page).getByRole('button', { name: 'Backup & restore' }).click()
  await restoreFrom(page, file)
  const line = backupDialog(page).getByRole('status').filter({ hasText: 'backup' })
  await expect(line).toHaveText('This file isn’t a Task Tracker backup. Choose a file you downloaded from Backup & restore.')
  await expect(line.locator('svg')).toHaveCount(1)
})

test('grouped by project, cards don’t repeat the group’s @project', async ({ app, page }) => {
  await app.loadSampleData()
  await app.openFilters()
  await page.getByLabel('Group by').selectOption({ label: 'Project' })
  const work = page.getByRole('list', { name: 'Work tasks' })
  await expect(work.getByRole('listitem').first()).toBeVisible()
  await expect(work.getByText('@Work', { exact: true })).toHaveCount(0)
  // Tags still show.
  await expect(work.getByText('#quick', { exact: true })).toBeVisible()
})

test.describe('light', () => {
  test.use({ colorScheme: 'light' })

  test('overdue is one red: the ring matches the date', async ({ app, page }) => {
    await app.loadSampleData()
    const row = app.taskRow('Renew car insurance')
    const date = await row.locator('[data-overdue]').evaluate((e) => getComputedStyle(e).color)
    expect(await tokenColour(page, '--alert-outline')).toBe(date)
  })
})

test('the discard bar’s Save doesn’t look like Discard', async ({ app, page }) => {
  await app.loadSampleData()
  await app.taskRow('Pay rent').locator('[data-card-edit]').click()
  const editor = page.getByRole('dialog')
  await editor.getByLabel('Title').fill('Pay rent and water bill')
  await page.keyboard.press('Escape')
  const bar = editor.getByRole('group', { name: 'Discard your changes?' })
  const bg = (name: string) => bar.getByRole('button', { name, exact: true }).evaluate((e) => getComputedStyle(e).backgroundColor)
  expect(await bg('Save')).not.toBe(await bg('Discard'))
})

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 1280, height: 800 } })

  test('the list doesn’t offer a keyboard hint', async ({ app, page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await app.loadSampleData()
    await expect(page.getByText('for shortcuts')).toBeHidden()
  })
})

test('with a mouse the keyboard hint stays', async ({ app, page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await app.loadSampleData()
  await expect(page.getByText('for shortcuts')).toBeVisible()
})
