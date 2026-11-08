// Full backup and restore. Files are embedded as base64 so one JSON file holds everything.
import type { Attachment, Label, Task } from '../types'
import { createMetaStore, db as defaultDb, type TaskTrackerDB } from './db'

export const BACKUP_APP = 'task-tracker'
export const BACKUP_VERSION = 1
export const LAST_BACKUP_KEY = 'lastBackupAt'
export const BACKUP_NUDGE_DAYS = 14

type StoredAttachment = Omit<Attachment, 'blob'> & { blobBase64?: string; blobType?: string }

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  tasks: Task[]
  projects: Label[]
  tags: Label[]
  attachments: StoredAttachment[]
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

function base64ToBlob(b64: string, type: string): Blob {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export function createBackup(db: TaskTrackerDB = defaultDb) {
  const meta = createMetaStore(db)

  return {
    async exportData(now = new Date()): Promise<BackupFile> {
      const [tasks, projects, tags, attachments] = await Promise.all([
        db.tasks.toArray(),
        db.projects.toArray(),
        db.tags.toArray(),
        db.attachments.toArray(),
      ])
      const stored = await Promise.all(
        attachments.map(async ({ blob, ...rest }): Promise<StoredAttachment> =>
          blob ? { ...rest, blobBase64: await blobToBase64(blob), blobType: blob.type } : rest,
        ),
      )
      await meta.set(LAST_BACKUP_KEY, now.getTime())
      return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), tasks, projects, tags, attachments: stored }
    },

    /** Replaces all tasks, projects, tags and attachments with the backup's contents. */
    async importData(raw: unknown): Promise<{ tasks: number; attachments: number }> {
      const data = validate(raw)
      const attachments: Attachment[] = data.attachments.map(({ blobBase64, blobType, ...rest }) =>
        blobBase64 !== undefined ? { ...rest, blob: base64ToBlob(blobBase64, blobType ?? '') } : rest,
      )
      await db.transaction('rw', [db.tasks, db.projects, db.tags, db.attachments], async () => {
        await Promise.all([db.tasks.clear(), db.projects.clear(), db.tags.clear(), db.attachments.clear()])
        await db.tasks.bulkAdd(data.tasks)
        await db.projects.bulkAdd(data.projects)
        await db.tags.bulkAdd(data.tags)
        await db.attachments.bulkAdd(attachments)
      })
      return { tasks: data.tasks.length, attachments: attachments.length }
    },

    lastBackupAt: () => meta.get<number>(LAST_BACKUP_KEY),
  }
}

function validate(raw: unknown): BackupFile {
  const fail = (why: string): never => {
    throw new Error(`This isn't a valid Task Tracker backup (${why})`)
  }
  if (!raw || typeof raw !== 'object') fail('not a JSON object')
  const d = raw as Partial<BackupFile>
  if (d.app !== BACKUP_APP) fail('wrong app')
  if (typeof d.version !== 'number' || d.version > BACKUP_VERSION) fail(`unsupported version ${String(d.version)}`)
  for (const key of ['tasks', 'projects', 'tags', 'attachments'] as const) {
    if (!Array.isArray(d[key])) fail(`missing ${key}`)
  }
  if (!d.tasks!.every((t) => t && typeof t.id === 'string' && typeof t.title === 'string')) fail('a task is malformed')
  // Fill in list fields so older or hand-edited backups still load.
  const tasks = d.tasks!.map((t) => ({ ...t, tagIds: t.tagIds ?? [], checklist: t.checklist ?? [], reminders: t.reminders ?? [] }))
  return { ...(d as BackupFile), tasks }
}

export const backup = createBackup()
