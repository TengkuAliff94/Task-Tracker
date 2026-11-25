// Colour means time and state, so each panel hue has one job (re-critique P2, #31).
// Priority is a glyph and a word, not a colour; only Urgent keeps a hue (rust).
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

/** The computed rgb() of a CSS custom property, for comparing against an element's colours. */
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

const bgOf = (el: Locator) => el.evaluate((e) => getComputedStyle(e).backgroundColor)

/** Every panel hue that means a time or a state. Priority must not borrow any of them. */
const STATE_PANELS = ['--panel-maroon', '--panel-mustard', '--panel-violet', '--panel-sage', '--panel-taupe']

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    test('priority badges carry the signal bars and borrow no time or state colour', async ({ app, page }) => {
      await app.loadSampleData()
      const state = await Promise.all(STATE_PANELS.map((t) => tokenColour(page, t)))
      const cases = [
        ['Reply to recruiter email', 'low', 1],
        ['Pay rent', 'high', 3],
      ] as const
      // Medium, the default, has no badge on the card (step 24).
      await expect(app.taskRow('Grocery run').locator('[data-priority]')).toHaveCount(0)
      for (const [title, priority, lit] of cases) {
        const badge = app.taskRow(title).locator(`[data-priority="${priority}"]`)
        await expect(badge.locator(`[data-priority-glyph="${lit}"]`)).toHaveCount(1)
        expect(state, `${priority} badge isn't a time/state panel`).not.toContain(await bgOf(badge))
      }
      const urgent = app.taskRow('Renew car insurance').locator('[data-priority="urgent"]')
      await expect(urgent.locator('[data-priority-glyph="4"]')).toHaveCount(1)
      expect(await bgOf(urgent)).toBe(await tokenColour(page, '--panel-rust'))
    })

    test('only Urgent cards carry a stripe, in rust (High has none, #40)', async ({ app, page }) => {
      await app.loadSampleData()
      await expect(app.taskRow('Reply to recruiter email').locator('[data-priority-stripe]')).toHaveCount(0)
      await expect(app.taskRow('Grocery run').locator('[data-priority-stripe]')).toHaveCount(0)
      // High keeps its glyph and word; an ink stripe would read as the selection marker.
      await expect(app.taskRow('Pay rent').locator('[data-priority-stripe]')).toHaveCount(0)
      await expect(app.taskRow('Pay rent').locator('[data-priority="high"] [data-priority-glyph="3"]')).toHaveCount(1)
      expect(await bgOf(app.taskRow('Renew car insurance').locator('[data-priority-stripe]'))).toBe(await tokenColour(page, '--panel-rust'))
    })

    test('a pressed priority filter is ink, not the Due today mustard', async ({ app, page }) => {
      await app.loadSampleData()
      await app.openFilters()
      const high = page.getByRole('button', { name: 'High', exact: true })
      await high.click()
      await expect(high).toHaveAttribute('aria-pressed', 'true')
      // Polled: the pill's colour eases over 200ms.
      const ink = await tokenColour(page, '--fg')
      await expect.poll(() => bgOf(high)).toBe(ink)
    })

    test('violet means open work only: toasts and the backup reminder are not violet', async ({ app, page }) => {
      await app.loadSampleData()
      await app.showBackupNudge()
      const violet = await tokenColour(page, '--panel-violet')
      const nudge = page.getByRole('status').filter({ hasText: 'backed up' })
      await expect(nudge).toBeVisible()
      expect(await bgOf(nudge)).not.toBe(violet)

      await app.taskRow('Pay rent').getByRole('checkbox').click()
      const toast = page.getByRole('status').filter({ hasText: 'Done: Pay rent' })
      await expect(toast).toBeVisible()
      expect(await bgOf(toast)).toBe(await tokenColour(page, '--fg'))
    })
  })
}
