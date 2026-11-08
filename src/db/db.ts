import Dexie, { type EntityTable } from 'dexie'
import type { Attachment, Project, Tag, Task } from '../types'

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
