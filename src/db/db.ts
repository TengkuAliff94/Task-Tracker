import Dexie, { type EntityTable } from 'dexie'
import type { Attachment, Project, Tag, Task } from '../types'

export class TaskTrackerDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  projects!: EntityTable<Project, 'id'>
  tags!: EntityTable<Tag, 'id'>
  attachments!: EntityTable<Attachment, 'id'>

  constructor(name = 'task-tracker') {
    super(name)
    this.version(1).stores({
      tasks: 'id, status, priority, projectId, *tagIds, createdAt, deletedAt',
      projects: 'id, name',
      tags: 'id, name',
      attachments: 'id, taskId',
    })
  }
}

export const db = new TaskTrackerDB()
