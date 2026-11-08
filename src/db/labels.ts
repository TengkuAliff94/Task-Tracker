// Storage for projects and tags. Both are named, colored labels.
import type { EntityTable } from 'dexie'
import type { Label } from '../types'
import { nextColor } from '../lib/colors'
import { db as defaultDb, type TaskTrackerDB } from './db'

const norm = (s: string) => s.trim().toLowerCase()

function labelTable(table: EntityTable<Label, 'id'>) {
  async function assertUnique(name: string, exceptId?: string) {
    const all = await table.toArray()
    if (all.some((x) => x.id !== exceptId && norm(x.name) === norm(name))) {
      throw new Error(`"${name}" already exists`)
    }
    return all
  }

  return {
    list: () => table.orderBy('name').toArray(),

    async create(name: string, color?: string): Promise<Label> {
      const clean = name.trim()
      if (!clean) throw new Error('Name is required')
      const all = await assertUnique(clean)
      const item: Label = { id: crypto.randomUUID(), name: clean, color: color ?? nextColor(all.map((x) => x.color)) }
      await table.add(item)
      return item
    },

    /** Case-insensitive lookup; creates the label if it doesn't exist. */
    async findOrCreate(name: string): Promise<Label> {
      const found = (await table.toArray()).find((x) => norm(x.name) === norm(name))
      return found ?? this.create(name)
    },

    async update(id: string, patch: Partial<Omit<Label, 'id'>>): Promise<void> {
      const next = { ...patch }
      if (next.name !== undefined) {
        next.name = next.name.trim()
        if (!next.name) throw new Error('Name is required')
        await assertUnique(next.name, id)
      }
      await table.update(id, next)
    },
  }
}

export function createLabelRepo(db: TaskTrackerDB = defaultDb) {
  const projects = {
    ...labelTable(db.projects),

    /** How many tasks (including trashed ones) use this project. */
    countTasks: (id: string) => db.tasks.where('projectId').equals(id).count(),

    /** Deletes the project and moves its tasks to "No project". */
    remove: (id: string) =>
      db.transaction('rw', db.projects, db.tasks, async () => {
        await db.tasks.where('projectId').equals(id).modify((task) => {
          delete task.projectId
        })
        await db.projects.delete(id)
      }),
  }

  const tags = {
    ...labelTable(db.tags),

    countTasks: (id: string) => db.tasks.where('tagIds').equals(id).count(),

    /** Deletes the tag and removes it from every task. */
    remove: (id: string) =>
      db.transaction('rw', db.tags, db.tasks, async () => {
        await db.tasks.where('tagIds').equals(id).modify((task) => {
          task.tagIds = task.tagIds.filter((t) => t !== id)
        })
        await db.tags.delete(id)
      }),
  }

  return { projects, tags }
}

const repos = createLabelRepo()
export const projectRepo = repos.projects
export const tagRepo = repos.tags
