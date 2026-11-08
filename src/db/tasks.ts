// The only module that touches task storage. Swap it for an API client to add a backend later.
import type { ChecklistItem, Deadline, Priority, Recurrence, Reminder, Status, Task } from '../types'
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
  checklist?: ChecklistItem[]
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
        checklist: input.checklist ?? [],
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

    /** Moves a task to Trash. It can be restored until it's purged. */
    async trash(id: string, now = Date.now()): Promise<void> {
      await db.tasks.update(id, { deletedAt: now })
    },

    async restore(id: string): Promise<void> {
      await db.tasks.where('id').equals(id).modify((t) => {
        delete t.deletedAt
      })
    },

    /** Every stored task, including any in Trash. */
    countAll(): Promise<number> {
      return db.tasks.count()
    },

    countTrash(): Promise<number> {
      return db.tasks.filter((t) => t.deletedAt !== undefined).count()
    },

    /** Trashed tasks, most recently deleted first. */
    async listTrash(): Promise<Task[]> {
      const trashed = await db.tasks.filter((t) => t.deletedAt !== undefined).toArray()
      return trashed.sort((a, b) => b.deletedAt! - a.deletedAt!)
    },

    /** Deletes tasks and their attachments for good. */
    purge(ids: string[]): Promise<void> {
      return db.transaction('rw', db.tasks, db.attachments, async () => {
        await db.attachments.where('taskId').anyOf(ids).delete()
        await db.tasks.bulkDelete(ids)
      })
    },

    /** Purges everything in Trash, or only items trashed more than `olderThanDays` ago. Returns the count. */
    async emptyTrash(olderThanDays = 0, now = Date.now()): Promise<number> {
      const cutoff = now - olderThanDays * 86_400_000
      const ids = (await db.tasks.filter((t) => t.deletedAt !== undefined && t.deletedAt <= cutoff).toArray()).map(
        (t) => t.id,
      )
      if (ids.length) await this.purge(ids)
      return ids.length
    },
  }
}

export const TRASH_RETENTION_DAYS = 30

export const taskRepo = createTaskRepo()
