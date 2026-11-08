// Every piece of text stays readable on whatever it sits on, in both themes: WCAG AA contrast
// (4.5:1, or 3:1 for large text), checked by axe on the real rendered screens.
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

/** Contrast problems on the page as it is now, one line each, so a failure says what to fix. */
async function contrastProblems(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  return violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(' ')}: ${n.any[0]?.message ?? n.failureSummary ?? v.help}`),
  )
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    // Reduced motion so axe measures settled colours, not something halfway through fading in.
    test.use({ colorScheme, reducedMotion: 'reduce' })

    test(`task list, completed tasks and the backup nudge are readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await page.getByText(/^Show completed/).click()
      await expect(app.taskRow('File expense claims')).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`pressed filter pills are readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      // One of each kind: every priority and status colour, and a user-coloured tag.
      for (const name of ['Low', 'Medium', 'High', 'Urgent', 'To Do', 'In Progress', 'Done', '#errand']) {
        await page.getByRole('button', { name, exact: true }).click()
      }
      await expect(page.getByRole('button', { name: '#errand', exact: true })).toHaveAttribute('aria-pressed', 'true')
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`the task editor is readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.taskRow('Prepare quarterly review slides').getByRole('button').click()
      await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`the projects & tags, backup and shortcuts dialogs are readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()

      for (const [button, dialog] of [
        ['Projects & tags', 'Projects & tags'],
        ['Backup & restore', 'Backup & restore'],
        ['Keyboard shortcuts', 'Keyboard shortcuts'],
      ] as const) {
        await page.getByRole('button', { name: button }).click()
        const open = page.getByRole('dialog', { name: dialog })
        await expect(open).toBeVisible()
        expect(await contrastProblems(page), dialog).toEqual([])
        await page.keyboard.press('Escape')
        await expect(open).toBeHidden()
      }
    })

    test(`the empty state, Trash and the undo toast are readable (${colorScheme})`, async ({ app, page }) => {
      expect(await contrastProblems(page)).toEqual([])

      await app.quickAdd('Old errand')
      await app.taskRow('Old errand').getByRole('button').click()
      await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByRole('status').filter({ hasText: 'moved to Trash' })).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])

      await page.getByRole('button', { name: 'Trash (1)' }).click()
      await expect(page.getByRole('list', { name: 'Trashed tasks' })).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })
  })
}
