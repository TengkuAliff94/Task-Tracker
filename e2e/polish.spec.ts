// The polish pass (#27): each test pins one detail that used to drift from DESIGN.md.
import { expect, test } from './fixtures'
import type { Locator } from '@playwright/test'

const style = (el: Locator, prop: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop)

test.describe('with sample data', () => {
  test.beforeEach(async ({ app }) => {
    await app.loadSampleData()
  })

  test('a picked Overview tile shows a clear mark, not only an outline like keyboard focus', async ({ page }) => {
    const overdue = page.getByRole('region', { name: 'Overview' }).getByRole('button', { name: /^Overdue/ })
    await expect(overdue.locator('[data-picked-mark]')).toHaveCount(0)
    await overdue.click()
    await expect(overdue.locator('[data-picked-mark]:visible')).toHaveCount(1)
  })

  test('the picked mark shows on phones too, where tile icons are left out', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const open = page.getByRole('region', { name: 'Overview' }).getByRole('button', { name: /^Open/ })
    await open.click()
    await expect(open.locator('[data-picked-mark]:visible')).toHaveCount(1)
  })

  test('project and tag chips put the sigil against the name, as typed', async ({ app }) => {
    const card = app.taskRow('Renew car insurance')
    for (const [sigil, name] of [['@', 'Home'], ['#', 'finance']]) {
      const chip = card.getByText(`${sigil}${name}`, { exact: true })
      await expect(chip).toBeVisible()
      // The text is right either way; what drifted was the drawn space between sigil and name.
      const gap = await chip.evaluate((el, [s, n]) => {
        const nodes: Text[] = []
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        while (walk.nextNode()) nodes.push(walk.currentNode as Text)
        const rect = (text: string) => {
          const node = nodes.find((t) => t.data === text)!
          const range = document.createRange()
          range.selectNodeContents(node)
          return range.getBoundingClientRect()
        }
        return rect(n).left - rect(s).right
      }, [sigil, name])
      expect(gap, `${sigil}${name} is drawn as one word`).toBeLessThan(1)
    }
  })

  test('the quick-add preview spells an existing project or tag the way the card will', async ({ app }) => {
    await app.quickAddInput.fill('Fix tap @home #FINANCE #newtag')
    await expect(app.quickAddPreview.getByText('@Home', { exact: true })).toBeVisible()
    await expect(app.quickAddPreview.getByText('#finance', { exact: true })).toBeVisible()
    // A name that doesn't exist yet shows as typed.
    await expect(app.quickAddPreview.getByText('#newtag', { exact: true })).toBeVisible()
  })

  test('a search with no results says what it searched for and offers Clear search', async ({ page }) => {
    await page.locator('#search').fill('zzzz')
    const empty = page.locator('[data-empty-state]')
    await expect(empty).toContainText('No tasks match “zzzz”.')
    await empty.getByRole('button', { name: 'Clear search' }).click()
    await expect(page.locator('#search')).toHaveValue('')
    await expect(page.locator('#search')).toBeFocused()
    await expect(page.getByRole('list', { name: 'Tasks' })).toBeVisible()
  })

  test('filters with no results offer Clear filters, which keeps Show completed as it was', async ({ app, page }) => {
    await app.openFilters()
    await page.getByText(/^Show completed/).click()
    await page.locator('#search').fill('zzzz')
    await page.getByRole('group', { name: 'Priority' }).getByRole('button', { name: 'High' }).click()
    const empty = page.locator('[data-empty-state]')
    await expect(empty).toContainText('No tasks match these filters.')
    await empty.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.locator('#search')).toHaveValue('')
    await expect(page.getByRole('group', { name: 'Priority' }).getByRole('button', { name: 'High' })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('checkbox', { name: /^Show completed/ })).toBeChecked()
  })

  test('"Show completed" is the square sibling of the task checkbox, not the browser\'s own', async ({ app, page }) => {
    await app.openFilters()
    const box = page.getByRole('checkbox', { name: /^Show completed/ })
    expect(await style(box, 'appearance')).toBe('none')
    expect(await style(box, 'border-top-left-radius')).toBe('4px')
    await box.check()
    await expect(box).toBeChecked()
  })

  test('Trash: titles aren\'t struck through, the heading is bold, and New task isn\'t offered', async ({ app, page }) => {
    await app.taskRow('Renew car insurance').locator('[data-card-edit]').click()
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Move to Trash' }).click()
    await page.getByRole('button', { name: 'Trash (1)' }).click()
    const title = page.getByRole('list', { name: 'Trashed tasks' }).getByText('Renew car insurance')
    expect(await style(title, 'text-decoration-line')).toBe('none')
    expect(await style(page.getByRole('heading', { name: 'Trash', level: 1 }), 'font-weight')).toBe('700')
    await expect(page.getByRole('banner').getByRole('button', { name: 'New task' })).toBeHidden()
  })

  test('the toast\'s Undo is the ink panel inverted, not a second brand-orange button', async ({ app, page }) => {
    // click, not check: the ticked card leaves the list at once.
    await app.taskRow('Renew car insurance').getByRole('checkbox').click()
    const undo = page.getByRole('status').filter({ hasText: 'Done: Renew car insurance' }).getByRole('button', { name: 'Undo' })
    await expect(undo).toBeVisible()
    const [bg, ink] = await undo.evaluate((el) => {
      const root = getComputedStyle(document.documentElement)
      const probe = document.createElement('span')
      document.body.append(probe)
      const resolve = (v: string) => ((probe.style.color = root.getPropertyValue(v)), getComputedStyle(probe).color)
      const out = [resolve('--bg'), resolve('--fg')]
      probe.remove()
      return [getComputedStyle(el).backgroundColor === out[0], getComputedStyle(el).color === out[1]]
    })
    expect(bg, 'Undo is filled with the canvas colour').toBe(true)
    expect(ink, 'Undo’s text is the body text colour').toBe(true)
  })

  test('the editor footer is solid, with no rule above it', async ({ app, page }) => {
    await app.taskRow('Renew car insurance').locator('[data-card-edit]').click()
    const save = page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Save' })
    const footer = save.locator('xpath=ancestor::div[contains(@class,"sticky")][1]')
    expect(await style(footer, 'border-top-width')).toBe('0px')
    expect(await style(footer, 'background-color')).toMatch(/^rgb\(/)
    expect(await style(footer, 'backdrop-filter')).toBe('none')
  })

  test('the Markdown preview is a plain well, with no border', async ({ app, page }) => {
    await app.taskRow('Renew car insurance').locator('[data-card-edit]').click()
    const editor = page.getByRole('dialog', { name: 'Edit task' })
    await editor.getByRole('tab', { name: 'Preview' }).click()
    const well = editor.getByRole('tab', { name: 'Preview' }).locator('xpath=ancestor::div[2]/following-sibling::div[1]')
    expect(await style(well, 'border-top-width')).toBe('0px')
  })

  test('Projects & tags: names sit in field wells, swatches are round, and each label shows its task count', async ({ page }) => {
    await page.getByRole('button', { name: 'Projects & tags' }).click()
    const dialog = page.getByRole('dialog', { name: 'Projects & tags' })
    const name = dialog.getByRole('textbox', { name: 'Name of Home' })
    expect(await style(name, 'background-color')).not.toBe('rgba(0, 0, 0, 0)')
    await expect(name).toHaveAccessibleDescription('4 tasks')
    expect(await style(dialog.getByRole('button', { name: 'Color for Home' }), 'border-top-left-radius')).toBe('9999px')
  })
})

test('the sticky header is solid canvas, not a blur over the tiles', async ({ app, page }) => {
  void app // opens the app
  const header = page.getByRole('banner')
  expect(await style(header, 'backdrop-filter')).toBe('none')
  expect(await style(header, 'background-color')).toMatch(/^rgb\(/)
})

test('small type stays on the scale: key caps and the Trash count are 12px', async ({ app, page }) => {
  await app.quickAdd('Throw away')
  await app.taskRow('Throw away').locator('[data-card-edit]').click()
  await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Move to Trash' }).click()
  const badge = page.getByRole('button', { name: 'Trash (1)' }).locator('span[aria-hidden]')
  expect(await style(badge, 'font-size')).toBe('12px')
  expect(await style(page.locator('kbd').first(), 'font-size')).toBe('12px')
})

test('the shortcuts sheet uses the same key caps as the rest of the app', async ({ app, page }) => {
  void app // opens the app
  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  // "J / K" is two keys.
  await expect(dialog.locator('kbd').filter({ hasText: /^J$/ })).toHaveCount(1)
  await expect(dialog.locator('kbd').filter({ hasText: /^K$/ })).toHaveCount(1)
  expect(await style(dialog.locator('kbd').first(), 'font-family')).not.toMatch(/mono/i)
})
