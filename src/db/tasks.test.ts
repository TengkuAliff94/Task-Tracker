import { beforeEach, describe, expect, it } from 'vitest'
import { TaskTrackerDB } from './db'
import { createTaskRepo } from './tasks'

let repo: ReturnType<typeof createTaskRepo>

beforeEach(() => {
  repo = createTaskRepo(new TaskTrackerDB(`test-${crypto.randomUUID()}`))
})

describe('task repo', () => {
  it('creates a task with defaults and a createdAt', async () => {
    const task = await repo.create({ title: '  Pay rent  ' }, 1000)
    expect(task).toMatchObject({
      title: 'Pay rent',
      status: 'todo',
      priority: 'medium',
      createdAt: 1000,
      completedAt: undefined,
    })
    expect(await repo.list()).toHaveLength(1)
  })

  it('rejects an empty title', async () => {
    await expect(repo.create({ title: '   ' })).rejects.toThrow('Title is required')
  })

  it('sets completedAt when done and clears it when reopened', async () => {
    const { id } = await repo.create({ title: 'A' }, 1000)
    await repo.setStatus(id, 'done', 2000)
    expect((await repo.get(id))?.completedAt).toBe(2000)
    await repo.setStatus(id, 'in_progress', 3000)
    expect((await repo.get(id))?.completedAt).toBeUndefined()
  })

  it('does not change completedAt when status is unchanged', async () => {
    const { id } = await repo.create({ title: 'A', status: 'done' }, 1000)
    await repo.update(id, { status: 'done', title: 'B' }, 5000)
    expect(await repo.get(id)).toMatchObject({ title: 'B', completedAt: 1000 })
  })

  it('hides trashed tasks from list', async () => {
    const { id } = await repo.create({ title: 'A' })
    await repo.update(id, { deletedAt: Date.now() })
    expect(await repo.list()).toHaveLength(0)
  })
})
