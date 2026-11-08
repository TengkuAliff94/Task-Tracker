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

export { expect }
