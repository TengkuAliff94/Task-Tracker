// Shared Playwright setup for the e2e flows. Import `test` and `expect` from here, not '@playwright/test'.
//
// Every test gets a fresh browser context, so IndexedDB and localStorage start empty.
// The `app` fixture pins the clock to FIXED_NOW, opens the app and checks that it really is empty
// before the test runs.
import { expect, test as base, type Locator, type Page } from '@playwright/test'

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Finds things the way a user would: by role and accessible name. */
export class App {
  constructor(readonly page: Page) {}

  /** Opens the app and waits until the empty task list shows. */
  async open() {
    await this.page.goto('/')
    await expect(this.page.getByText('No tasks yet')).toBeVisible()
  }

  get quickAddInput(): Locator {
    return this.page.getByLabel('Quick add task')
  }

  /** The live preview under the quick-add bar showing what was parsed. */
  get quickAddPreview(): Locator {
    return this.page.getByRole('group', { name: 'Quick add preview' })
  }

  /** Types into the quick-add bar and presses Enter. */
  async quickAdd(text: string) {
    await this.quickAddInput.fill(text)
    await this.quickAddInput.press('Enter')
    await expect(this.quickAddInput).toHaveValue('')
  }

  /** Loads the demo tasks from the empty state and waits until they show. */
  async loadSampleData() {
    await this.page.getByRole('button', { name: 'Load sample data' }).click()
    // The load is one transaction, so the first row to appear means the full set is in.
    await expect(this.taskRow('Renew car insurance')).toBeVisible()
  }

  /**
   * Brings up the backup reminder on purpose, as it shows for someone who has used the app for real
   * for 4 days without a backup: records that first use straight into IndexedDB, then reloads so the
   * app reads it. Sample data alone never brings it up.
   */
  async showBackupNudge() {
    await this.page.evaluate(
      ([key, at]) =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('task-tracker')
          open.onerror = () => reject(open.error)
          open.onsuccess = () => {
            const tx = open.result.transaction('meta', 'readwrite')
            tx.objectStore('meta').put({ key, value: at })
            tx.oncomplete = () => {
              open.result.close()
              resolve()
            }
            tx.onerror = () => reject(tx.error)
          }
        }),
      ['firstUsedAt', FIXED_NOW.getTime() - 4 * 86_400_000] as const,
    )
    await this.page.reload()
    await expect(this.backupNudge).toBeVisible()
  }

  /** The backup reminder's "Remind me later" button, which only exists while the reminder shows. */
  get backupNudge(): Locator {
    return this.page.getByRole('button', { name: 'Remind me later' })
  }

  /** The task cards in a list, in reading order. Lists are named "Tasks", or "<group> tasks" when grouped. */
  taskCards(list = 'Tasks'): Locator {
    return this.page.getByRole('list', { name: list }).getByRole('listitem')
  }

  /** The Filters disclosure button beside search. */
  get filtersToggle(): Locator {
    return this.page.getByRole('button', { name: /^Filters( \d+ active)?$/ })
  }

  /** Opens the filter panel (project, sort, group, the filter pills and "Show completed"), if it's closed. */
  async openFilters() {
    if ((await this.filtersToggle.getAttribute('aria-expanded')) !== 'true') await this.filtersToggle.click()
    await expect(this.filtersToggle).toHaveAttribute('aria-expanded', 'true')
  }

  /** True when the page can scroll sideways, i.e. something is wider than the screen. */
  scrollsSideways(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  }

  /** The task list row whose title is exactly `title`. */
  taskRow(title: string): Locator {
    const checkbox = this.page.getByRole('checkbox', {
      name: new RegExp(`^Mark "${escapeRegExp(title)}" as (not )?done$`),
    })
    return this.page.getByRole('list', { name: /tasks$/i }).getByRole('listitem').filter({ has: checkbox })
  }
}

/**
 * Every test starts at this moment (Malaysia time, set in playwright.config.ts) instead of the real clock,
 * so "today", "tomorrow" and "in 7 days" mean the same dates on every run. Mid-morning on a Tuesday keeps
 * clear of midnight and month ends. Time still moves forward from here, so timers behave normally.
 */
export const FIXED_NOW = new Date('2026-03-10T09:00:00+08:00')

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await page.clock.install({ time: FIXED_NOW })
    const app = new App(page)
    await app.open()
    await use(app)
  },
})

/**
 * Opens the task editor's More details (Status, Effort, Repeat, Reminders, Attachments), which
 * starts closed on every open. Does nothing if it's already open.
 */
export async function openMoreDetails(editor: Locator) {
  const toggle = editor.getByRole('button', { name: /^More details/ })
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  // The fields fade up into place; measure them only once they've settled.
  const panel = editor.locator(`[id="${await toggle.getAttribute('aria-controls')}"]`)
  await expect.poll(() => isAnimating(panel)).toBe(false)
}

/** Whether anything inside `el` is running a CSS or Web Animation right now. */
export const isAnimating = (el: Locator) =>
  el.evaluate((node) => node.getAnimations({ subtree: true }).some((a) => a.playState === 'running'))

/** Where something is drawn on screen; fails the test if it isn't rendered. */
export async function box(locator: Locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('not rendered')
  return b
}

export { expect }
