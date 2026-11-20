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
      await app.openFilters()
      await page.getByText(/^Show completed/).click()
      await expect(app.taskRow('File expense claims')).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`pressed filter pills are readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.openFilters()
      // One of each kind: every priority and status colour, and a user-coloured tag.
      for (const name of ['Low', 'Medium', 'High', 'Urgent', 'To Do', 'In Progress', 'Done', '#errand']) {
        await page.getByRole('button', { name, exact: true }).click()
      }
      await expect(page.getByRole('button', { name: '#errand', exact: true })).toHaveAttribute('aria-pressed', 'true')
      expect(await contrastProblems(page)).toEqual([])

      // Collapsed, the same filters show as chips in the same colours.
      await app.filtersToggle.click()
      await expect(page.getByRole('button', { name: 'Remove #errand filter' })).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`the task editor is readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.taskRow('Prepare quarterly review slides').getByRole('button').click()
      await expect(page.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`the editor's "Discard your changes?" bar is readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.taskRow('Prepare quarterly review slides').getByRole('button').click()
      const editor = page.getByRole('dialog', { name: 'Edit task' })
      await editor.getByLabel('Title').fill('Prepare the review slides')
      await page.keyboard.press('Escape')
      await expect(editor.getByRole('group', { name: 'Discard your changes?' })).toBeVisible()
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

    test(`a destructive confirmation and its solid Delete button are readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await page.getByRole('button', { name: 'Projects & tags' }).click()
      await page.getByRole('dialog', { name: 'Projects & tags' }).getByRole('button', { name: /^Delete / }).first().click()
      const ask = page.getByRole('alertdialog', { name: 'Delete this project?' })
      await expect(ask).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
      // Hovered too: the go-ahead darkens (light) or lightens (dark) and must stay AA.
      await ask.getByRole('button', { name: 'Delete project' }).hover()
      expect(await contrastProblems(page)).toEqual([])
    })

    test(`the editor's inline errors and deadline readout are readable (${colorScheme})`, async ({ app, page }) => {
      void app
      await page.getByRole('banner').getByRole('button', { name: 'New task' }).click()
      const editor = page.getByRole('dialog', { name: 'New task' })
      await editor.getByLabel('Effort').fill('a while')
      await editor.getByLabel('Deadline date').fill('2026-03-11')
      await editor.getByLabel('Add link').fill('ftp://example.com')
      await editor.getByRole('button', { name: 'Add task' }).click()
      await expect(editor.getByText('Give the task a title.')).toBeVisible()
      await expect(editor.getByTestId('deadline-readout')).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })
  })
}
