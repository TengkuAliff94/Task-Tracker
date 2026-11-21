// WCAG 2.2 AA behaviour that axe can't see (#26): where focus goes after J/K and after something
// disappears, toasts that wait while a dialog covers them and are announced, errors read out as
// alerts, controls reachable by keyboard and touch, and nothing focused hidden under the header.
import type { Page } from '@playwright/test'
import { box, expect, test, type App } from './fixtures'

const checkbox = (page: Page, title: string, done = false) =>
  page.getByRole('checkbox', { name: `Mark "${title}" as ${done ? 'not done' : 'done'}` })
/** A card's title button, which opens it in the editor. */
const editButton = (app: App, title: string) => app.taskRow(title).locator('[data-card-edit]')
const doneToast = (page: Page) => page.getByRole('status').filter({ hasText: /^Done: / })

/** Quick-adds tasks with no deadline. They list newest first, so the last one added comes first. */
async function addTasks(app: App, ...titles: string[]) {
  for (const t of titles) await app.quickAdd(t)
  await expect(app.taskCards()).toHaveCount(titles.length)
  await app.quickAddInput.blur() // so J, K, X and Z reach the shortcuts, not the field
}

test.describe('J and K', () => {
  test('move real focus to the card, keeping it marked as current', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C') // listed C, B, A
    await page.keyboard.press('j')
    await expect(editButton(app, 'C')).toBeFocused()
    await expect(app.taskRow('C')).toHaveAttribute('aria-current', 'true')
    await page.keyboard.press('j')
    await expect(editButton(app, 'B')).toBeFocused()
    await page.keyboard.press('k')
    await expect(editButton(app, 'C')).toBeFocused()
    await expect(app.taskRow('B')).not.toHaveAttribute('aria-current')
  })

  test('carry on from the card Tab reached, on the same control', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C')
    await checkbox(page, 'B').focus()
    await page.keyboard.press('Tab') // B's title button, by keyboard, so it becomes the selection
    await expect(app.taskRow('B')).toHaveAttribute('aria-current', 'true')
    await page.keyboard.press('Shift+Tab') // back to B's checkbox
    await page.keyboard.press('j')
    await expect(checkbox(page, 'A')).toBeFocused()
    await expect(app.taskRow('A')).toHaveAttribute('aria-current', 'true')
  })
})

test.describe('focus after something disappears', () => {
  test('deleting from the editor moves focus to the card that takes its place', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C') // listed C, B, A
    await editButton(app, 'B').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await expect(app.taskRow('B')).toHaveCount(0)
    await expect(editButton(app, 'A')).toBeFocused()
  })

  test('deleting the only task moves focus to the empty list', async ({ app, page }) => {
    await addTasks(app, 'Only one')
    await editButton(app, 'Only one').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('region', { name: 'No tasks yet' })).toBeFocused()
  })

  test('ticking a card off moves focus to the next card’s checkbox', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C')
    await checkbox(page, 'B').click()
    await expect(app.taskRow('B')).toHaveCount(0)
    await expect(checkbox(page, 'A')).toBeFocused()
  })

  test('X moves focus along with the selection', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C')
    await page.keyboard.press('j')
    await page.keyboard.press('x')
    await expect(app.taskRow('C')).toHaveCount(0)
    await expect(editButton(app, 'B')).toBeFocused()
  })

  test('emptying Trash, or restoring its last task, moves focus to the empty Trash', async ({ app, page }) => {
    await addTasks(app, 'A', 'B')
    for (const t of ['A', 'B']) {
      await editButton(app, t).click()
      await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
      await expect(app.taskRow(t)).toHaveCount(0)
    }
    await page.getByRole('button', { name: 'Trash (2)' }).click()
    await page.getByRole('button', { name: 'Restore "B"' }).click()
    await expect(page.getByRole('button', { name: 'Restore "A"' })).toBeFocused()
    await page.getByRole('button', { name: 'Restore "A"' }).press('Enter')
    await expect(page.getByRole('region', { name: 'Nothing in Trash' })).toBeFocused()

    await page.getByRole('button', { name: 'Back to tasks' }).click()
    await editButton(app, 'A').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Trash (1)' }).click()
    await page.getByRole('button', { name: 'Empty trash' }).click()
    await page.getByRole('alertdialog', { name: 'Empty Trash?' }).getByRole('button', { name: 'Delete forever' }).click()
    await expect(page.getByRole('region', { name: 'Nothing in Trash' })).toBeFocused()
  })
})

test.describe('toasts', () => {
  // Reduced motion: moving the fake clock on stalls the slide-out (see completion.spec.ts).
  test.use({ reducedMotion: 'reduce' })

  test('the countdown waits while a dialog covers the toast, then starts again', async ({ app, page }) => {
    await addTasks(app, 'Book the venue')
    await checkbox(page, 'Book the venue').click()
    await expect(doneToast(page)).toBeVisible()

    await page.getByRole('banner').getByRole('button', { name: 'New task' }).click()
    const editor = page.getByRole('dialog', { name: 'New task' })
    await expect(editor).toBeVisible()
    await page.waitForTimeout(100)
    await page.clock.runFor(20_000)
    await page.keyboard.press('Escape') // nothing typed, so it closes at once
    await expect(editor).toBeHidden()
    await expect(doneToast(page)).toBeVisible()

    await page.waitForTimeout(100)
    await page.clock.runFor(6_500)
    await expect(doneToast(page)).toBeHidden()
  })

  test('a new toast is announced through a live region that was there from the start', async ({ app, page }) => {
    const live = page.locator('[aria-live="polite"]').filter({ hasNot: page.getByRole('status') })
    await expect(live).toHaveCount(1)
    await expect(live).toBeEmpty()
    await addTasks(app, 'Water the plants')
    await checkbox(page, 'Water the plants').click()
    await expect(live).toHaveText('Done: Water the plants. Press Z to undo.')
    // The toast's own status role stays quiet, so it isn't read twice.
    await expect(doneToast(page)).toHaveAttribute('aria-live', 'off')
    await expect(page.getByRole('region', { name: 'Notifications' })).toBeVisible()
  })

  test('after Undo, focus goes back to where it was before the toast', async ({ app, page }) => {
    await addTasks(app, 'Keep', 'Undo me')
    await checkbox(page, 'Undo me').click()
    await expect(checkbox(page, 'Keep')).toBeFocused()
    const undo = doneToast(page).getByRole('button', { name: 'Undo' })
    await undo.focus()
    await undo.press('Enter')
    await expect(checkbox(page, 'Undo me')).toBeVisible()
    await expect(checkbox(page, 'Keep')).toBeFocused()
  })
})

test.describe('errors are read out', () => {
  test('quick add', async ({ app, page }) => {
    await app.quickAddInput.fill('#errand')
    await app.quickAddInput.press('Enter')
    const alert = page.getByRole('alert').filter({ hasText: 'Add a title' })
    await expect(alert).toBeVisible()
    await expect(app.quickAddInput).toHaveAttribute('aria-invalid', 'true')
    await expect(app.quickAddInput).toHaveAccessibleDescription(/Add a title as well/)
  })

  test('a duplicate project name', async ({ app, page }) => {
    await app.quickAdd('Plan trip @travel')
    await page.getByRole('banner').getByRole('button', { name: 'Projects & tags' }).click()
    const name = page.getByLabel('New project name')
    await name.fill('travel')
    await name.press('Enter')
    await expect(page.getByRole('alert').filter({ hasText: 'already exists' })).toBeVisible()
    await expect(name).toHaveAccessibleDescription(/already exists/)
  })
})

test('with notifications blocked, the explanation is reachable by keyboard', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Notification, 'permission', { get: () => 'denied' }))
  await page.goto('/')
  const blocked = page.getByRole('button', { name: 'Notifications blocked' })
  await expect(blocked).toHaveAccessibleDescription(/allow them for this site in your browser’s settings/)
  await page.keyboard.press('Tab')
  await expect(blocked).toBeFocused()
  await page.keyboard.press('Enter')
  const tip = page.getByText(/^Notifications are blocked, so reminders only show inside the app/)
  await expect(tip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()
})

test('card figures say what they count', async ({ app }) => {
  await app.loadSampleData()
  await expect(editButton(app, 'Grocery run')).toHaveAccessibleName(/Checklist: \d of 3 done/)
  await app.quickAdd('Write report ~90m')
  await expect(editButton(app, 'Write report')).toHaveAccessibleName(/Effort: 1 hour 30 minutes/)
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })

  test('Shift+Tab onto the backup reminder brings it out from under the sticky header', async ({ app, page }) => {
    await app.loadSampleData()
    await app.showBackupNudge()
    const later = page.getByRole('button', { name: 'Remind me later' })
    // Scroll down, then back up to just where the reminder sits under the header (which returns on
    // the way up), and put focus on quick add without moving the page.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(200)
    await later.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 30))
    await expect(page.locator('header')).toHaveAttribute('data-hidden', 'false')
    await app.quickAddInput.evaluate((el) => el.focus({ preventScroll: true }))

    const header = page.locator('header')
    for (const name of ['Remind me later', 'Back up now']) {
      await page.keyboard.press('Shift+Tab')
      const focused = page.getByRole('button', { name })
      await expect(focused).toBeFocused()
      expect((await box(focused)).y, `${name} is clear of the header`).toBeGreaterThanOrEqual((await box(header)).y + (await box(header)).height)
    }
  })

  test('quick add fits its placeholder and shows the syntax while focused', async ({ app, page }) => {
    await expect(app.quickAddInput).toHaveAttribute('placeholder', 'Quick add a task')
    const fits = await app.quickAddInput.evaluate((el: HTMLInputElement) => {
      const s = getComputedStyle(el)
      const ctx = document.createElement('canvas').getContext('2d')!
      ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
      return ctx.measureText(el.placeholder).width <= el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
    })
    expect(fits).toBe(true)
    const hint = page.getByText(/^Add details as you type:/)
    await expect(app.quickAddInput).toHaveAccessibleDescription(/#tag @project !high ~30m tomorrow 5pm/)
    await app.quickAddInput.focus()
    await expect(hint).toBeVisible()
    await app.quickAddInput.fill('Pay rent')
    await expect(app.quickAddPreview).toBeVisible()
    expect((await hint.boundingBox())?.height ?? 0).toBeLessThanOrEqual(1) // back to visually hidden
  })

  test('the task checkbox is a 44px touch target', async ({ app }) => {
    await app.loadSampleData()
    const label = app.taskCards().first().locator('label').filter({ has: app.page.getByRole('checkbox') })
    const b = await box(label)
    expect(b.width).toBeGreaterThanOrEqual(44)
    expect(b.height).toBeGreaterThanOrEqual(44)
  })
})
