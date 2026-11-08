// Shared Playwright setup for the e2e flows. Import `test` and `expect` from here, not '@playwright/test'.
//
// Every test gets a fresh browser context, so IndexedDB and localStorage start empty.
// The `app` fixture opens the app and checks that it really is empty before the test runs.
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

  /** The task list row whose title is exactly `title`. */
  taskRow(title: string): Locator {
    const checkbox = this.page.getByRole('checkbox', {
      name: new RegExp(`^Mark "${escapeRegExp(title)}" as (not )?done$`),
    })
    return this.page.getByRole('list', { name: /tasks$/i }).getByRole('listitem').filter({ has: checkbox })
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    const app = new App(page)
    await app.open()
    await use(app)
  },
})

export { expect }
