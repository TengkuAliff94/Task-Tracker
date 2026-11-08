import { beforeEach, describe, expect, it } from 'vitest'
import { TaskTrackerDB } from './db'
import { createTaskRepo } from './tasks'
import { createLabelRepo } from './labels'
import { createSampleData } from './sample'
import { isOverdue } from '../lib/deadline'

let db: TaskTrackerDB
let sample: ReturnType<typeof createSampleData>

// Sunday 8 Nov 2026, 10:00 local time.
const NOW = new Date(2026, 10, 8, 10, 0)

beforeEach(() => {
  db = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
  sample = createSampleData(db)
})

describe('sample data', () => {
  it('loads tasks that show off overdue, recurring, done and in-progress states', async () => {
    const count = await sample.load(NOW)
    const tasks = await createTaskRepo(db).list()

    expect(count).toBe(tasks.length)
    expect(tasks.length).toBeGreaterThanOrEqual(8)
    expect(tasks.some((t) => isOverdue(t, NOW))).toBe(true)
    expect(tasks.some((t) => t.recurrence && t.deadline)).toBe(true)
    expect(tasks.some((t) => t.status === 'done' && t.completedAt !== undefined)).toBe(true)
    expect(tasks.some((t) => t.status === 'in_progress')).toBe(true)
    expect(tasks.some((t) => t.checklist.length > 0)).toBe(true)
  })

  it('places deadlines relative to now', async () => {
    await sample.load(NOW)
    const tasks = await createTaskRepo(db).list()
    expect(tasks.some((t) => t.deadline?.date === '2026-11-09')).toBe(true) // tomorrow
    expect(tasks.every((t) => t.createdAt <= NOW.getTime())).toBe(true)
  })

  it('links tasks to projects and tags that exist', async () => {
    await sample.load(NOW)
    const { projects, tags } = createLabelRepo(db)
    const projectIds = new Set((await projects.list()).map((p) => p.id))
    const tagIds = new Set((await tags.list()).map((t) => t.id))
    const tasks = await createTaskRepo(db).list()

    expect(projectIds.size).toBeGreaterThan(0)
    expect(tagIds.size).toBeGreaterThan(0)
    for (const t of tasks) {
      if (t.projectId) expect(projectIds.has(t.projectId)).toBe(true)
      for (const id of t.tagIds) expect(tagIds.has(id)).toBe(true)
    }
  })

  it('reuses existing labels with the same name instead of duplicating them', async () => {
    const { projects } = createLabelRepo(db)
    const home = await projects.create('Home', '#000000')
    await sample.load(NOW)

    const homes = (await projects.list()).filter((p) => p.name.toLowerCase() === 'home')
    expect(homes).toEqual([home])
    const tasks = await createTaskRepo(db).list()
    expect(tasks.some((t) => t.projectId === home.id)).toBe(true)
  })
})
