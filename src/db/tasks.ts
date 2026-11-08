// The only module that touches task storage. Swap it for an API client to add a backend later.
import type { Deadline, Priority, Status, Task } from '../types'
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
}

export type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt'>>

export function createTaskRepo(db: TaskTrackerDB = defaultDb) {
  async function update(id: string, patch: TaskPatch, now = Date.now()): Promise<void> {
    const existing = await db.tasks.get(id)
    if (!existing) throw new Error(`Task ${id} not found`)
    const next: Task = { ...existing, ...patch }
    if (patch.title !== undefined) {
      next.title = patch.title.trim()
      if (!next.title) throw new Error('Title is required')
    }
    // Keep completedAt in step with status.
    if (patch.status !== undefined && patch.status !== existing.status) {
      next.completedAt = patch.status === 'done' ? now : undefined
    }
    await db.tasks.put(next)
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
        reminders: [],
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
