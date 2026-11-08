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
