// Step 42: the eighth critique's P3. The filter bar's action pills are filled wells, the open tag
// search shows a bounded preview before anything is typed, and the sample-data question ignores Trash.
import type { Page } from '@playwright/test'
import { expect, test, type App } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const TAGS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima']

async function addManyTags(app: App, page: Page) {
  await app.open()
  await app.quickAdd(`Many tags ${TAGS.map((t) => `#${t}`).join(' ')}`)
  await page.keyboard.press('Escape')
  await app.openFilters()
  return page.getByRole('group', { name: 'Tags', exact: true })
}

/** The well colour: the computed `--subtle` on the page. */
const subtle = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--subtle)'
    document.body.append(probe)
    const c = getComputedStyle(probe).backgroundColor
    probe.remove()
    return c
  })

const bg = (l: import('@playwright/test').Locator) => l.evaluate((e) => getComputedStyle(e).backgroundColor)

test('N more, Fewer tags and Clear filters sit in the same filled well as their neighbours', async ({ app, page }) => {
  const tags = await addManyTags(app, page)
  const well = await subtle(page)
  const more = tags.getByRole('button', { name: '8 more tags' })
  expect(await bg(more)).toBe(well)
  await more.click()
  expect(await bg(tags.getByRole('button', { name: 'Fewer tags' }))).toBe(well)
  await tags.getByRole('button', { name: '#alpha' }).click()
  expect(await bg(page.getByRole('button', { name: 'Clear filters' }))).toBe(well)
})

test('the open tag search shows the picked tags plus eight before anything is typed', async ({ app, page }) => {
  const tags = await addManyTags(app, page)
  await tags.getByRole('button', { name: '8 more tags' }).click()
  const find = tags.getByRole('searchbox', { name: 'Find a tag' })
  await expect(tags.getByRole('button', { name: /^#/ })).toHaveCount(8)
  await expect(tags.getByText('Type to find the other 4.')).toBeVisible()

  // A tag past the preview, picked through the search, stays in view once the search is emptied.
  await find.fill('lima')
  await tags.getByRole('button', { name: '#lima' }).click()
  await find.fill('')
  await expect(tags.getByRole('button', { name: /^#/ })).toHaveCount(9)
  await expect(tags.getByRole('button', { name: '#lima' })).toHaveAttribute('aria-pressed', 'true')
  await expect(tags.getByText('Type to find the other 3.')).toBeVisible()
  // While a search is typed, the hint goes: the matches are the whole answer.
  await find.fill('a')
  await expect(tags.locator('[data-tags-unlisted]')).toHaveCount(0)
})

async function trash(app: App, page: Page, title: string) {
  await app.taskRow(title).locator('[data-card-edit]').click()
  await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Delete' }).click()
  await expect(app.taskRow(title)).toHaveCount(0)
}

async function askForSample(page: Page) {
  await page.getByRole('button', { name: /^Backup/ }).click()
  await page.getByRole('button', { name: 'Load sample data' }).click()
}

test('with one sample task in Trash, loading again still says the set is here', async ({ app, page }) => {
  await app.loadSampleData()
  await trash(app, page, 'Renew car insurance')
  await askForSample(page)
  const question = page.getByRole('alertdialog', { name: 'Sample tasks are already here' })
  await expect(question).toContainText('9 of the 10 sample tasks are already in your list. Loading again adds all 10, so those 9 show twice.')
  await question.getByRole('button', { name: 'Cancel' }).click()
})

test('the question counts only the tasks in the list, not Trash', async ({ app, page }) => {
  await app.open()
  await app.quickAdd('Water plants')
  await app.quickAdd('Call the bank')
  await page.keyboard.press('Escape')
  await trash(app, page, 'Call the bank')
  await askForSample(page)
  await expect(page.getByRole('alertdialog', { name: 'Add sample tasks?' })).toContainText('alongside your 1 existing task.')
})

test('with only Trash left, the sample set loads without a question', async ({ app, page }) => {
  await app.open()
  await app.quickAdd('Water plants')
  await page.keyboard.press('Escape')
  await trash(app, page, 'Water plants')
  // The list is empty again, so the empty state offers the sample set itself.
  await page.getByRole('button', { name: 'Load sample data' }).click()
  await expect(app.taskRow('Renew car insurance')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})
