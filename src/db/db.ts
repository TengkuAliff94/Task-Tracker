import Dexie, { type EntityTable } from 'dexie'
import type { Attachment, Project, Tag, Task } from '../types'

/** Meta key: when the person started using the app for real (see usage.ts). */
export const FIRST_USED_KEY = 'firstUsedAt'

export class TaskTrackerDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  projects!: EntityTable<Project, 'id'>
  tags!: EntityTable<Tag, 'id'>
  attachments!: EntityTable<Attachment, 'id'>
  meta!: EntityTable<Meta, 'key'>

  constructor(name = 'task-tracker') {
    super(name)
    this.version(1).stores({
      tasks: 'id, status, priority, projectId, *tagIds, createdAt, deletedAt',
      projects: 'id, name',
      tags: 'id, name',
      attachments: 'id, taskId',
    })
    this.version(2).stores({ meta: 'key' })
    // Installs from before "first used" was recorded start their count from their oldest task, as the
    // backup nudge always did, so nobody who relies on the app loses the reminder. New installs skip this.
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        const oldest = await tx.table<Task>('tasks').orderBy('createdAt').first()
        if (oldest && !(await tx.table<Meta>('meta').get(FIRST_USED_KEY))) {
          await tx.table<Meta>('meta').put({ key: FIRST_USED_KEY, value: oldest.createdAt })
        }
      })
  }
}

/** Small app-level values, e.g. when reminders were last checked. */
export interface Meta {
  key: string
  value: unknown
}

export function createMetaStore(db: TaskTrackerDB) {
  return {
    async get<T>(key: string): Promise<T | undefined> {
      return (await db.meta.get(key))?.value as T | undefined
    },
    async set(key: string, value: unknown): Promise<void> {
      await db.meta.put({ key, value })
    },
  }
}

export const db = new TaskTrackerDB()
export const meta = createMetaStore(db)
