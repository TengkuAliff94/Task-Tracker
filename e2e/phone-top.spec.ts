// Step 34: on phones the heading and the Overview tiles read as one compact unit, so the list starts
// higher. The heading carries "2 overdue · 1 today"; the tiles are one row of four.
import type { Page } from '@playwright/test'
import { box, expect, test } from './fixtures'

test.use({ reducedMotion: 'reduce' })

const overview = (page: Page) => page.getByRole('region', { name: 'Overview' })
const tiles = (page: Page) => overview(page).getByRole('button')
const aside = (page: Page) => page.getByText('· 1 today', { exact: true })

for (const width of [320, 390]) {
  test.describe(`phone ${width}`, () => {
    test.use({ viewport: { width, height: 844 } })

    test('the tiles are one row of four, each label shown whole', async ({ app, page }) => {
      await app.loadSampleData()
      const tops = await Promise.all((await tiles(page).all()).map(async (t) => (await box(t)).y))
      expect(tops).toHaveLength(4)
      for (const y of tops) expect(Math.abs(y - tops[0])).toBeLessThan(1)
      // No label is cut off with an ellipsis.
      const clipped = await overview(page).locator('button span.truncate').evaluateAll((spans) =>
        spans.filter((s) => s.scrollWidth > s.clientWidth).map((s) => s.textContent),
      )
      expect(clipped).toEqual([])
      expect(await app.scrollsSideways()).toBe(false)
    })

    test('the heading says what is overdue and what is due today', async ({ app, page }) => {
      await app.loadSampleData()
      await expect(page.getByText('2 overdue', { exact: true })).toBeVisible()
      await expect(aside(page)).toBeVisible()
      // Both on the heading's second line, not wrapped apart.
      const a = await box(page.getByText('2 overdue', { exact: true }))
      const b = await box(aside(page))
      expect(Math.abs(a.y - b.y)).toBeLessThan(2)
    })

    test('the list starts in the top 60% of the first screen', async ({ app, page }) => {
      await app.loadSampleData()
      await page.evaluate(() => window.scrollTo(0, 0))
      const first = await box(app.taskCards().first())
      expect(first.y).toBeLessThanOrEqual(844 * 0.6)
    })

    test('the heading and the tiles sit tight together, apart from quick add', async ({ app, page }) => {
      await app.loadSampleData()
      // The innermost panel around the heading is the slab.
      const slab = await box(page.locator('.rounded-panel', { has: page.locator('#page-heading') }).last())
      const o = await box(overview(page))
      const q = await box(app.quickAddInput)
      expect(o.y - (slab.y + slab.height)).toBeLessThanOrEqual(8)
      expect(q.y - (o.y + o.height)).toBeGreaterThanOrEqual(20)
    })

    test('a picked tile still shows its mark', async ({ page, app }) => {
      await app.loadSampleData()
      const completed = overview(page).getByRole('button', { name: /^Completed\b/ })
      await completed.click()
      await expect(completed.locator('[data-picked-mark]:visible')).toHaveCount(1)
    })
  })
}

/** Copies one open sample task until there are `extra` more, straight into IndexedDB, then reloads. */
async function addOpenTasks(page: Page, extra: number) {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('task-tracker')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const tx = open.result.transaction('tasks', 'readwrite')
          const store = tx.objectStore('tasks')
          const all = store.getAll()
          all.onsuccess = () => {
            const base = all.result.find((t) => t.status !== 'done' && !t.deletedAt && !t.deadline)
            for (let i = 0; i < n; i++) store.put({ ...base, id: `bulk-${i}`, title: `Bulk ${i}` })
          }
          tx.oncomplete = () => {
            open.result.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
    extra,
  )
  await page.reload()
}

test.describe('narrowest phone, huge counts', () => {
  test.use({ viewport: { width: 320, height: 844 } })

  test('a three-digit count, picked, never pushes the top past the page', async ({ app, page }) => {
    await app.loadSampleData()
    await addOpenTasks(page, 100)
    const openTile = overview(page).getByRole('button', { name: /^Open\b/ })
    await expect(openTile).toHaveAccessibleName(/^Open\s*10\d/)
    await openTile.click()
    await expect(openTile).toHaveAttribute('aria-pressed', 'true')
    expect(await app.scrollsSideways()).toBe(false)
    const slab = await box(page.locator('.rounded-panel', { has: page.locator('#page-heading') }).last())
    const o = await box(overview(page))
    const q = await box(page.locator('.rounded-panel', { has: app.quickAddInput }).last())
    // The heading and the tiles keep the same 16px gutters as quick add.
    expect(Math.abs(slab.x + slab.width - (q.x + q.width))).toBeLessThan(1)
    expect(o.x + o.width).toBeLessThanOrEqual(q.x + q.width + 0.5)
  })
})

test.describe('from sm', () => {
  test.use({ viewport: { width: 640, height: 900 } })

  test('the heading keeps its single urgency and the tiles their large layout', async ({ app, page }) => {
    await app.loadSampleData()
    await expect(page.getByText('2 overdue', { exact: true })).toBeVisible()
    await expect(aside(page)).toBeHidden()
    const o = await box(overview(page))
    expect(o.height).toBeGreaterThan(100)
  })
})
