// The only module that touches task storage. Swap it for an API client to add a backend later.
import type { Deadline, Priority, Recurrence, Reminder, Status, Task } from '../types'
import { nextInstance } from '../lib/recurrence'
import { db as defaultDb, type TaskTrackerDB } from './db'

export interface TaskInput {
  title: string
  description?: string
  status?: Status
  priority?: Priority
  deadline?: Deadline
  projectId?: string
  tagIds?: string[]
  effortMinutes?: number
  reminders?: Reminder[]
  recurrence?: Recurrence
}

export type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt'>>

export function createTaskRepo(db: TaskTrackerDB = defaultDb) {
  /**
   * Applies a patch. Status changes keep completedAt in step, and completing a recurring task
   * creates its next instance (once). Reopening it moves that instance to Trash, as long as
   * nobody has started it yet.
   */
  async function update(id: string, patch: TaskPatch, now = Date.now()): Promise<void> {
    await db.transaction('rw', db.tasks, async () => {
      const existing = await db.tasks.get(id)
      if (!existing) throw new Error(`Task ${id} not found`)
      const next: Task = { ...existing, ...patch }
      if (patch.title !== undefined) {
        next.title = patch.title.trim()
        if (!next.title) throw new Error('Title is required')
      }
      if (!next.recurrence || !next.deadline) delete next.recurrence

      const statusChanged = patch.status !== undefined && patch.status !== existing.status
      if (statusChanged) next.completedAt = patch.status === 'done' ? now : undefined

      if (statusChanged && next.status === 'done' && next.recurrence && !existing.nextInstanceId) {
        const spawned = nextInstance(next, new Date(now))
        await db.tasks.add(spawned)
        next.nextInstanceId = spawned.id
      }

      if (statusChanged && existing.status === 'done' && existing.nextInstanceId) {
        const spawned = await db.tasks.get(existing.nextInstanceId)
        if (spawned && spawned.status === 'todo' && spawned.deletedAt === undefined) {
          await db.tasks.update(spawned.id, { deletedAt: now })
        }
        delete next.nextInstanceId
      }

      await db.tasks.put(next)
    })
  }

  return {
    async list(): Promise<Task[]> {
      return db.tasks.filter((t) => t.deletedAt === undefined).toArray()
    },

    async get(id: string): Promise<Task | undefined> {
      return db.tasks.get(id)
    },

    async create(input: TaskInput, now = Date.now()): Promise<Task> {
      const title = input.title.trim()
      if (!title) throw new Error('Title is required')
      const status = input.status ?? 'todo'
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        description: input.description ?? '',
        status,
        priority: input.priority ?? 'medium',
        deadline: input.deadline,
        projectId: input.projectId,
        tagIds: input.tagIds ?? [],
        effortMinutes: input.effortMinutes,
        checklist: [],
        reminders: input.reminders ?? [],
        recurrence: input.deadline ? input.recurrence : undefined,
        createdAt: now,
        completedAt: status === 'done' ? now : undefined,
      }
      await db.tasks.add(task)
      return task
    },

    update,

    setStatus(id: string, status: Status, now = Date.now()): Promise<void> {
      return update(id, { status }, now)
    },
  }
}

export const taskRepo = createTaskRepo()
