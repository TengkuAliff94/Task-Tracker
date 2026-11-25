import { beforeEach, describe, expect, it } from 'vitest'
import { TaskTrackerDB } from './db'
import { createLabelRepo } from './labels'
import { createTaskRepo } from './tasks'

let db: TaskTrackerDB
let labels: ReturnType<typeof createLabelRepo>
let tasks: ReturnType<typeof createTaskRepo>

beforeEach(() => {
  db = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
  labels = createLabelRepo(db)
  tasks = createTaskRepo(db)
})

describe('labels', () => {
  it('rejects duplicate names case-insensitively', async () => {
    await labels.tags.create('Finance')
    await expect(labels.tags.create(' finance ')).rejects.toThrow('already exists')
  })

  it('findOrCreate reuses an existing label', async () => {
    const a = await labels.projects.findOrCreate('Home')
    const b = await labels.projects.findOrCreate('home')
    expect(b.id).toBe(a.id)
    expect(await labels.projects.list()).toHaveLength(1)
  })

  it('labels created at the same time still get different colours, and a name twice makes one label (#46)', async () => {
    // Quick add creates a line's tags together; each create used to read the list before the others wrote.
    const made = await Promise.all(['a', 'b', 'c', 'B'].map((n) => labels.tags.findOrCreate(n)))
    expect(new Set(made.slice(0, 3).map((t) => t.color)).size).toBe(3)
    expect(made[3].id).toBe(made[1].id)
    expect(await labels.tags.list()).toHaveLength(3)
  })

  it('gives new labels different colors', async () => {
    const a = await labels.tags.create('a')
    const b = await labels.tags.create('b')
    expect(a.color).not.toBe(b.color)
  })

  it('deleting a project moves its tasks to "No project"', async () => {
    const p = await labels.projects.create('Work')
    const t = await tasks.create({ title: 'Report', projectId: p.id })
    expect(await labels.projects.countTasks(p.id)).toBe(1)
    await labels.projects.remove(p.id)
    const after = await tasks.get(t.id)
    expect(after?.title).toBe('Report')
    expect(after?.projectId).toBeUndefined()
    expect(await labels.projects.list()).toHaveLength(0)
  })

  it('deleting a tag removes it from tasks', async () => {
    const a = await labels.tags.create('a')
    const b = await labels.tags.create('b')
    const t = await tasks.create({ title: 'x', tagIds: [a.id, b.id] })
    await labels.tags.remove(a.id)
    expect((await tasks.get(t.id))?.tagIds).toEqual([b.id])
  })
})
