// Regenerates the README images: `npm run screenshots`.
// The clock is frozen at FIXED_NOW, so the sample data's relative dates ("Today", "In 3 days")
// and the timestamps shown in the editor come out the same on every run.
import type { Page } from '@playwright/test'
import { expect, FIXED_NOW, test, type App } from './fixtures'

/** Loads the demo tasks and hides the backup nudge, which would otherwise top every shot. */
async function loadSample(app: App) {
  // The fixture's clock keeps running from FIXED_NOW; stop it so "Added …" timestamps don't drift by seconds.
  await app.page.clock.setFixedTime(FIXED_NOW)
  await app.loadSampleData()
  await app.page.getByRole('button', { name: 'Remind me later' }).click()
}

/** Takes a shot that comes out the same every run: fonts loaded, no hover state, no animations. */
async function shoot(page: Page, name: string) {
  await page.mouse.move(0, 0)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' })
}

const OUT = 'docs/screenshots'

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme, viewport: { width: 1000, height: 900 } })

    test(`list view (${colorScheme})`, async ({ app, page }) => {
      await loadSample(app)
      await shoot(page, `list-${colorScheme}`)
    })
  })
}

test.describe('task editor', () => {
  test.use({ viewport: { width: 1000, height: 1100 } })

  test('task editor', async ({ app, page }) => {
    await loadSample(app)
    await app.taskRow('Prepare quarterly review slides').getByRole('button').click()
    await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
    await shoot(page, 'editor')
  })
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('mobile', async ({ app, page }) => {
    await loadSample(app)
    await shoot(page, 'mobile')
  })
})
