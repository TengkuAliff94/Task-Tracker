import { beforeEach, describe, expect, it } from 'vitest'
import { TaskTrackerDB } from './db'
import { createTaskRepo } from './tasks'
import { createLabelRepo } from './labels'
import { createSampleData } from './sample'
import { createAttachmentRepo } from './attachments'
import { createBackup } from './backup'
import { PRIORITIES, STATUSES } from '../types'
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

  it('covers every feature a demo visitor should see', async () => {
    await sample.load(NOW)
    const tasks = await createTaskRepo(db).list()
    const { projects, tags } = createLabelRepo(db)

    const projectList = await projects.list()
    const tagList = await tags.list()
    expect(projectList.length).toBeGreaterThanOrEqual(2)
    expect(projectList.length).toBeLessThanOrEqual(3)
    expect(tagList.length).toBeGreaterThanOrEqual(4)
    expect(tagList.length).toBeLessThanOrEqual(5)
    const colors = [...projectList, ...tagList].map((l) => l.color)
    expect(new Set(colors).size).toBe(colors.length)

    for (const p of PRIORITIES) expect(tasks.some((t) => t.priority === p), p).toBe(true)
    for (const s of STATUSES) expect(tasks.some((t) => t.status === s), s).toBe(true)

    // "Later this week" is covered across weekdays below.
    expect(tasks.some((t) => t.deadline?.date === '2026-11-08')).toBe(true)
    expect(tasks.some((t) => isOverdue(t, NOW))).toBe(true)
    expect(tasks.some((t) => !t.deadline)).toBe(true)

    expect(tasks.some((t) => t.recurrence?.unit === 'week')).toBe(true)
    expect(tasks.some((t) => t.reminders.some((r) => r.kind === 'relative'))).toBe(true)
    expect(tasks.some((t) => t.reminders.some((r) => r.kind === 'absolute' && r.at > NOW.getTime()))).toBe(true)
    expect(tasks.some((t) => t.checklist.some((c) => c.done) && t.checklist.some((c) => !c.done))).toBe(true)

    const counts = await createAttachmentRepo(db).countsByTask()
    const withLink = await Promise.all(
      [...counts.keys()].map((id) => createAttachmentRepo(db).listForTask(id)),
    )
    expect(withLink.flat().some((a) => a.kind === 'link' && a.url?.startsWith('https://'))).toBe(true)

    // Markdown description with a heading, a list and a link.
    expect(tasks.some((t) => /^#+ /m.test(t.description) && /^- /m.test(t.description) && /\[.+\]\(https?:\/\/.+\)/.test(t.description))).toBe(true)
  })

  it('passes the same validation as a backup import', async () => {
    await sample.load(NOW)
    const exported = JSON.parse(JSON.stringify(await createBackup(db).exportData(NOW)))
    const fresh = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
    const result = await createBackup(fresh).importData(exported)

    expect(result.tasks).toBe((await createTaskRepo(db).list()).length)
    expect(result.attachments).toBeGreaterThan(0)
  })

  it('reuses its own labels when loaded twice, adding tasks without replacing any', async () => {
    const first = await sample.load(NOW)
    const { projects, tags } = createLabelRepo(db)
    const projectsAfterFirst = await projects.list()
    const tagsAfterFirst = await tags.list()

    const second = await sample.load(NOW)

    expect(await projects.list()).toEqual(projectsAfterFirst)
    expect(await tags.list()).toEqual(tagsAfterFirst)
    expect(await createTaskRepo(db).list()).toHaveLength(first + second)
  })

  it('matches existing label names case-insensitively', async () => {
    const { tags } = createLabelRepo(db)
    const finance = await tags.create('FINANCE', '#000000')
    await sample.load(NOW)
    expect((await tags.list()).filter((t) => t.name.toLowerCase() === 'finance')).toEqual([finance])
  })

  // Weeks run Monday to Sunday (en-GB). "Later this week" means after tomorrow, up to Sunday;
  // on a Saturday only Sunday is left, so it's tomorrow.
  it.each([
    ['Mon', '2026-11-09', '2026-11-10'],
    ['Tue', '2026-11-10', '2026-11-11'],
    ['Wed', '2026-11-11', '2026-11-12'],
    ['Thu', '2026-11-12', '2026-11-13'],
    ['Fri', '2026-11-13', '2026-11-14'],
    ['Sat', '2026-11-14', '2026-11-14'],
  ])('on a %s (%s), has a task due later the same week', async (_day, today, after) => {
    const [y, m, d] = today.split('-').map(Number)
    await sample.load(new Date(y, m - 1, d, 10, 0))
    const tasks = await createTaskRepo(db).list()
    expect(tasks.some((t) => t.deadline && t.deadline.date > after && t.deadline.date <= '2026-11-15')).toBe(true)
  })

  it('on a Sunday, when the week has no days left, still has a task due in the next few days', async () => {
    await sample.load(NOW) // Sunday 8 Nov 2026
    const tasks = await createTaskRepo(db).list()
    expect(tasks.some((t) => t.deadline && t.deadline.date >= '2026-11-10' && t.deadline.date <= '2026-11-12')).toBe(true)
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
