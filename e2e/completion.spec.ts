// Completing a task: a "Done" toast confirms it and offers Undo, a recurring task's toast says when
// it's next due, and after X the selection takes the next card so J and K carry on from there.
import { type Locator, type Page } from '@playwright/test'
import { box, expect, test, type App } from './fixtures'

const doneToast = (page: Page) => page.getByRole('status').filter({ hasText: /^Done: / })
const checkbox = (page: Page, title: string, done = false) =>
  page.getByRole('checkbox', { name: `Mark "${title}" as ${done ? 'not done' : 'done'}` })
/** True when every line of the toast is drawn, none hidden behind an ellipsis or a clamp. */
const fullyDrawn = (toast: Locator) =>
  toast
    .locator('p')
    .evaluateAll((ps) => ps.every((p) => p.scrollHeight <= p.clientHeight + 1 && p.scrollWidth <= p.clientWidth + 1))
/** Lets React finish the update an event started before the test moves the fake clock on. */
const settle = (page: Page) => page.waitForTimeout(100)

/** Quick-adds tasks with no deadline. They list newest first, so the last one added comes first. */
async function addTasks(app: App, ...titles: string[]) {
  for (const t of titles) await app.quickAdd(t)
  await expect(app.taskCards()).toHaveCount(titles.length)
  await app.quickAddInput.blur() // so J, K, X and Z reach the shortcuts, not the field
}

/** The fixture pins today to Tuesday 10 March 2026. */
async function addWeeklyTaskDueToday(page: Page, title: string) {
  await page.getByRole('button', { name: 'New task' }).click()
  const form = page.getByRole('dialog', { name: 'New task' })
  await form.getByLabel('Title').fill(title)
  await form.getByLabel('Deadline date').fill('2026-03-10')
  await form.getByLabel('Deadline time').fill('09:30')
  await form.getByLabel('Repeat').selectOption({ label: 'Weekly' })
  await form.getByRole('button', { name: 'Add task' }).click()
  await expect(form).toBeHidden()
}

test('ticking a task shows a Done toast, and Undo puts it back', async ({ app, page }) => {
  await addTasks(app, 'Post the parcel', 'Call the bank')
  await checkbox(page, 'Call the bank').click()

  const toast = doneToast(page)
  await expect(toast).toHaveText(/Done: Call the bank/)
  await expect(app.taskRow('Call the bank')).toHaveCount(0)

  await toast.getByRole('button', { name: 'Undo' }).click()
  await expect(toast).toBeHidden()
  await expect(checkbox(page, 'Call the bank')).toBeVisible()
  await expect(app.taskCards()).toHaveCount(2)
})

test('Undo puts a task back to the status it had, not just to do', async ({ app, page }) => {
  await addTasks(app, 'Draft the budget')
  await app.taskRow('Draft the budget').getByRole('button').click()
  const edit = page.getByRole('dialog', { name: 'Edit task' })
  await edit.getByLabel('Status').selectOption({ label: 'In Progress' })
  await edit.getByRole('button', { name: 'Save' }).click()
  await expect(edit).toBeHidden()

  await checkbox(page, 'Draft the budget').click()
  await doneToast(page).getByRole('button', { name: 'Undo' }).click()
  await expect(app.taskRow('Draft the budget')).toContainText('In Progress')
})

test('a recurring task’s toast says when it’s next due, and Undo takes the new copy away', async ({ app, page }) => {
  await addWeeklyTaskDueToday(page, 'Water plants')
  await checkbox(page, 'Water plants').click()

  const toast = doneToast(page)
  await expect(toast).toContainText('Done: Water plants')
  await expect(toast).toContainText('Next due in 7 days 09:30')
  await expect(page.getByRole('listitem').filter({ hasText: 'In 7 days 09:30' })).toBeVisible()

  // Undo follows the reopen rule: the untouched copy goes to Trash and the original is back.
  await toast.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'In 7 days' })).toHaveCount(0) // once it has slid out
  await expect(app.taskRow('Water plants')).toHaveCount(1)
  await expect(app.taskRow('Water plants')).toContainText('Today 09:30')
  await expect(page.getByRole('button', { name: 'Trash (1)' })).toBeVisible()
})

test('a run of completions shows one toast, for the latest', async ({ app, page }) => {
  await addTasks(app, 'One', 'Two', 'Three')
  await checkbox(page, 'Three').click()
  await expect(doneToast(page)).toHaveText(/Done: Three/)
  await checkbox(page, 'Two').click()
  await expect(doneToast(page).filter({ hasText: 'Done: Three' })).toBeHidden() // once it has slid out
  await expect(doneToast(page)).toHaveCount(1)
  await expect(doneToast(page)).toHaveText(/Done: Two/)
})

test('reopening a task some other way takes its Done toast away', async ({ app, page }) => {
  await addTasks(app, 'Renew passport')
  await app.openFilters()
  await page.getByText('Show completed').click()
  await checkbox(page, 'Renew passport').click()
  await expect(doneToast(page)).toBeVisible()

  await checkbox(page, 'Renew passport', true).click()
  await expect(doneToast(page)).toBeHidden()
})

test.describe('keyboard', () => {
  test('after X, J and K carry on from the completed card’s place', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C', 'D') // listed D, C, B, A
    const cards = app.taskCards()

    await page.keyboard.press('j')
    await page.keyboard.press('j')
    await expect(app.taskRow('C')).toHaveAttribute('aria-current', 'true')

    // X completes C; B now holds its place and takes the selection.
    await page.keyboard.press('x')
    await expect(doneToast(page)).toHaveText(/Done: C/)
    await expect(cards).toHaveCount(3)
    await expect(app.taskRow('B')).toHaveAttribute('aria-current', 'true')

    await page.keyboard.press('j')
    await expect(app.taskRow('A')).toHaveAttribute('aria-current', 'true')

    // Completing the last card hands the selection back to the one before it.
    await page.keyboard.press('x')
    await expect(cards).toHaveCount(2)
    await expect(app.taskRow('B')).toHaveAttribute('aria-current', 'true')
    await page.keyboard.press('k')
    await expect(app.taskRow('D')).toHaveAttribute('aria-current', 'true')
  })

  test('a J or X pressed straight after X acts on the card that took its place', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C', 'D') // listed D, C, B, A
    await page.keyboard.press('j')
    await page.keyboard.press('j')
    await expect(app.taskRow('C')).toHaveAttribute('aria-current', 'true')

    // No waiting between keys: the selection must not lag behind the save.
    await page.keyboard.press('x')
    await page.keyboard.press('j')
    await expect(app.taskRow('A')).toHaveAttribute('aria-current', 'true')

    // X X: the second X completes A, which took B's place, rather than B a second time.
    await page.keyboard.press('k') // B
    await page.keyboard.press('x')
    await page.keyboard.press('x')
    await expect(app.taskCards()).toHaveCount(1)
    await expect(checkbox(page, 'D')).toBeVisible()
  })

  test('holding X down ticks off one task, not one per key repeat', async ({ app, page }) => {
    await addTasks(app, 'A', 'B', 'C')
    await page.keyboard.press('j')
    await page.keyboard.down('x')
    await page.keyboard.down('x') // a repeat
    await page.keyboard.down('x')
    await page.keyboard.up('x')
    await expect(doneToast(page)).toBeVisible()
    await expect(app.taskCards()).toHaveCount(2)
  })

  test('Z works while focus is on the checkbox that completed the task', async ({ app, page }) => {
    await addTasks(app, 'Beta')
    await app.openFilters()
    await page.getByText('Show completed').click()
    await checkbox(page, 'Beta').focus()
    await page.keyboard.press('Space')
    await expect(doneToast(page)).toBeVisible()
    await page.keyboard.press('z')
    await expect(checkbox(page, 'Beta')).toBeVisible()
    await expect(checkbox(page, 'Beta')).toBeFocused()
  })

  test('after X on a recurring task, J goes on to the next card, not its new copy', async ({ app, page }) => {
    await addTasks(app, 'Later chore')
    await addWeeklyTaskDueToday(page, 'Water plants') // due today, so it sorts first
    await expect(app.taskCards().first()).toContainText('Water plants')

    await page.keyboard.press('j')
    await page.keyboard.press('x')
    await expect(doneToast(page)).toContainText('Next due')
    await expect(app.taskRow('Later chore')).toHaveAttribute('aria-current', 'true')
  })
})

// Timing checks run with reduced motion: moving the fake clock on stalls the slide-out animation
// (it's driven partly by the browser's real clock), and the countdown is what's under test here.
test.describe('the 6-second countdown', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the toast waits while the pointer is on it', async ({ app, page }) => {
    await addTasks(app, 'Sort the post')
    await checkbox(page, 'Sort the post').click()
    const toast = doneToast(page)
    await expect(toast).toBeVisible()

    await toast.hover()
    await settle(page)
    await page.clock.runFor(10_000)
    await expect(toast).toBeVisible()

    await page.mouse.move(0, 0)
    await settle(page)
    await page.clock.runFor(6_500)
    await expect(toast).toBeHidden()
  })

  test('the toast waits while focus is inside it', async ({ app, page }) => {
    await addTasks(app, 'Clean the oven')
    await checkbox(page, 'Clean the oven').click()
    const undo = doneToast(page).getByRole('button', { name: 'Undo' })
    await undo.focus()
    await settle(page)
    await page.clock.runFor(10_000)
    await expect(undo).toBeVisible()
    await undo.press('Enter')
    await expect(checkbox(page, 'Clean the oven')).toBeVisible()
  })

  test('Z undoes the latest completion, and does nothing once the toast has gone', async ({ app, page }) => {
    await addTasks(app, 'Pay the gas bill')
    await page.keyboard.press('j')
    await page.keyboard.press('x')
    await expect(doneToast(page)).toBeVisible()
    await expect(doneToast(page).getByRole('button', { name: 'Undo' })).toHaveAttribute('aria-keyshortcuts', 'z')

    await page.keyboard.press('z')
    await expect(doneToast(page)).toBeHidden()
    await expect(checkbox(page, 'Pay the gas bill')).toBeVisible()

    await page.keyboard.press('j')
    await page.keyboard.press('x')
    await expect(doneToast(page)).toBeVisible()
    await settle(page)
    await page.clock.runFor(6_500)
    await expect(doneToast(page)).toBeHidden()
    await page.keyboard.press('z')
    await expect(app.taskCards()).toHaveCount(0)
  })

  test('holding Z down undoes only the newest toast', async ({ app, page }) => {
    await addTasks(app, 'Keep me', 'Old errand')
    await app.taskRow('Old errand').getByRole('button').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'moved to Trash' })).toBeVisible()
    await checkbox(page, 'Keep me').click()
    await expect(doneToast(page)).toBeVisible()

    await page.keyboard.down('z')
    await page.keyboard.down('z') // a repeat
    await page.keyboard.up('z')
    await expect(checkbox(page, 'Keep me')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'moved to Trash' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Trash (1)' })).toBeVisible()
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the toast still confirms the completion', async ({ app, page }) => {
    await addTasks(app, 'Book the MOT')
    await checkbox(page, 'Book the MOT').click()
    await expect(doneToast(page)).toHaveText(/Done: Book the MOT/)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })

  test('a very long title wraps inside the toast', async ({ app, page }) => {
    const title = 'Renew-the-home-insurance-policy-before-it-lapses-and-check-the-excess-'.repeat(3)
    await addTasks(app, title)
    await checkbox(page, title).click()
    const toast = doneToast(page)
    await expect(toast).toBeVisible()

    const b = await box(toast)
    expect(b.x).toBeGreaterThanOrEqual(15)
    expect(b.x + b.width).toBeLessThanOrEqual(390 - 15)
    expect(await app.scrollsSideways()).toBe(false)
    // The title is cut to 60 characters, so the toast stays short and nothing in it is clipped.
    await expect(toast).toContainText('…')
    expect(b.height).toBeLessThan(110)
    expect(await fullyDrawn(toast)).toBe(true)
  })

  test('a long title still leaves “moved to Trash” in view', async ({ app, page }) => {
    const title = 'Ask the landlord about the boiler service and the damp patch in the back bedroom ceiling'
    await addTasks(app, title)
    await app.taskRow(title).getByRole('button').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()

    const toast = page.getByRole('status').filter({ hasText: 'moved to Trash' })
    await expect(toast).toContainText('“Ask the landlord about the boiler service and the damp…” moved to Trash')
    expect(await fullyDrawn(toast)).toBe(true)
  })
})

test.describe('when storage refuses the change', () => {
  test.use({ reducedMotion: 'reduce' }) // the countdown check moves the fake clock on (see above)
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { failTaskWrites: boolean }
      w.failTaskWrites = false
      const put = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
        if (this.name === 'tasks' && w.failTaskWrites) throw new DOMException('Full', 'QuotaExceededError')
        return put.apply(this, args)
      }
    })
  })

  test('ticking says it couldn’t be saved and why, and the task stays open', async ({ app, page }) => {
    await addTasks(app, 'Pay the council tax')
    await page.evaluate(() => ((window as unknown as { failTaskWrites: boolean }).failTaskWrites = true))
    await checkbox(page, 'Pay the council tax').click()

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('“Pay the council tax” couldn’t be marked as done.')
    await expect(alert).toContainText('Remove a large attachment or free up some space, then try again.')
    await expect(doneToast(page)).toHaveCount(0)
    await expect(checkbox(page, 'Pay the council tax')).not.toBeChecked()
    expect(await fullyDrawn(alert)).toBe(true)
  })

  test('a failure stays on screen until it’s dismissed', async ({ app, page }) => {
    await addTasks(app, 'Pay the water bill')
    await page.evaluate(() => ((window as unknown as { failTaskWrites: boolean }).failTaskWrites = true))
    await checkbox(page, 'Pay the water bill').click()
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await settle(page)
    await page.clock.runFor(20_000)
    await expect(alert).toBeVisible()
    await alert.getByRole('button', { name: 'Dismiss' }).click()
    await expect(alert).toBeHidden()
  })

  test('if X can’t be saved, the selection comes back to the card', async ({ app, page }) => {
    await addTasks(app, 'Older', 'Newer') // listed Newer, Older
    await page.evaluate(() => ((window as unknown as { failTaskWrites: boolean }).failTaskWrites = true))
    await page.keyboard.press('j')
    await page.keyboard.press('x')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(app.taskRow('Newer')).toHaveAttribute('aria-current', 'true')
  })
})
