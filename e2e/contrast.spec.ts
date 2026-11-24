// Every piece of text stays readable on whatever it sits on, in both themes: WCAG AA contrast
// (4.5:1, or 3:1 for large text), checked by axe on the real rendered screens.
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test, openMoreDetails } from './fixtures'

/** Contrast problems on the page as it is now, one line each, so a failure says what to fix. */
async function contrastProblems(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  return violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(' ')}: ${n.any[0]?.message ?? n.failureSummary ?? v.help}`),
  )
}

/**
 * Placeholders that fall short of 4.5:1, which axe doesn't check. Each placeholder's colour is
 * painted over the backgrounds behind its field (alpha included) on a canvas, and the result measured.
 */
async function placeholderProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const paint = (colour: string) => {
      ctx.fillStyle = colour
      ctx.fillRect(0, 0, 1, 1)
    }
    const read = () => Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3))
    const luminance = (rgb: number[]) =>
      rgb
        .map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
    const fields = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]')]
    return fields.flatMap((el) => {
      if (!el.placeholder || !el.checkVisibility()) return []
      const layers: string[] = []
      for (let n: Element | null = el; n; n = n.parentElement) layers.unshift(getComputedStyle(n).backgroundColor)
      ctx.clearRect(0, 0, 1, 1)
      paint(getComputedStyle(document.documentElement).getPropertyValue('--bg'))
      layers.forEach(paint)
      const bg = read()
      paint(getComputedStyle(el, '::placeholder').color)
      const [hi, lo] = [luminance(read()), luminance(bg)].sort((x, y) => y - x)
      const ratio = (hi + 0.05) / (lo + 0.05)
      return ratio < 4.5 ? [`${el.getAttribute('aria-label') ?? el.placeholder}: ${ratio.toFixed(2)}:1`] : []
    })
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    // Reduced motion so axe measures settled colours, not something halfway through fading in.
    test.use({ colorScheme, reducedMotion: 'reduce' })

    test(`task list, completed tasks and the backup nudge are readable (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      await app.showBackupNudge()
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

    test(`placeholders are readable on the list, in the editor and in Projects & tags (${colorScheme})`, async ({ app, page }) => {
      await app.loadSampleData()
      expect(await placeholderProblems(page)).toEqual([])
      await page.getByRole('banner').getByRole('button', { name: 'New task' }).click()
      const editor = page.getByRole('dialog', { name: 'New task' })
      await editor.getByLabel('Project').selectOption({ label: '+ New project…' })
      expect(await placeholderProblems(page)).toEqual([])
      await page.keyboard.press('Escape') // Esc leaves the new-project field first
      await editor.getByRole('button', { name: 'Close' }).click()
      await expect(editor).toBeHidden()
      await page.getByRole('banner').getByRole('button', { name: 'Projects & tags' }).click()
      expect(await placeholderProblems(page)).toEqual([])
    })

    test(`the editor's inline errors and deadline readout are readable (${colorScheme})`, async ({ app, page }) => {
      void app
      await page.getByRole('banner').getByRole('button', { name: 'New task' }).click()
      const editor = page.getByRole('dialog', { name: 'New task' })
      await openMoreDetails(editor)
      await editor.getByLabel('Effort').fill('a while')
      await editor.getByLabel('Deadline date').fill('11/03/2026')
      await editor.getByLabel('Add link').fill('ftp://example.com')
      await editor.getByRole('button', { name: 'Add task' }).click()
      await expect(editor.getByText('Give the task a title.')).toBeVisible()
      await expect(editor.getByTestId('deadline-readout')).toBeVisible()
      expect(await contrastProblems(page)).toEqual([])
    })
  })
}
