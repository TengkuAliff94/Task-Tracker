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

  describe('recurring tasks', () => {
    const now = new Date(2026, 10, 8, 12).getTime()
    const recurring = {
      title: 'Gym',
      deadline: { date: '2026-11-08' },
      recurrence: { unit: 'day' as const, interval: 2 },
    }

    it('completing creates the next instance exactly once', async () => {
      const t = await repo.create(recurring, now)
      await repo.setStatus(t.id, 'done', now)
      await repo.update(t.id, { title: 'Gym!' }, now) // unrelated edit must not spawn again
      const open = (await repo.list()).filter((x) => x.status === 'todo')
      expect(open).toHaveLength(1)
      expect(open[0].deadline).toEqual({ date: '2026-11-10' })
      expect((await repo.get(t.id))?.nextInstanceId).toBe(open[0].id)
    })

    it('reopening trashes an untouched next instance', async () => {
      const t = await repo.create(recurring, now)
      await repo.setStatus(t.id, 'done', now)
      await repo.setStatus(t.id, 'todo', now)
      expect(await repo.list()).toHaveLength(1)
      // Completing again spawns a fresh one.
      await repo.setStatus(t.id, 'done', now)
      expect((await repo.list()).filter((x) => x.status === 'todo')).toHaveLength(1)
    })

    it('reopening keeps a next instance that was already started', async () => {
      const t = await repo.create(recurring, now)
      await repo.setStatus(t.id, 'done', now)
      const nextId = (await repo.get(t.id))!.nextInstanceId!
      await repo.setStatus(nextId, 'in_progress', now)
      await repo.setStatus(t.id, 'todo', now)
      expect(await repo.list()).toHaveLength(2)
    })

    it('drops recurrence when there is no deadline', async () => {
      const t = await repo.create({ title: 'x', recurrence: { unit: 'day', interval: 1 } })
      expect(t.recurrence).toBeUndefined()
    })
  })

  it('hides trashed tasks from list', async () => {
    const { id } = await repo.create({ title: 'A' })
    await repo.update(id, { deletedAt: Date.now() })
    expect(await repo.list()).toHaveLength(0)
  })
})
