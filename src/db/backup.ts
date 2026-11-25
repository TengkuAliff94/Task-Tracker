// Full backup and restore. Files are embedded as base64 so one JSON file holds everything.
import type { Attachment, Label, Task } from '../types'
import { createMetaStore, db as defaultDb, type TaskTrackerDB } from './db'
import { createUsage } from './usage'

export const BACKUP_APP = 'task-tracker'
export const BACKUP_VERSION = 1
export const LAST_BACKUP_KEY = 'lastBackupAt'
export const BACKUP_NUDGE_DAYS = 14
/** Days of real use before the first "you haven't backed up" nudge, and how long "Remind me later" lasts. */
export const NUDGE_GRACE_DAYS = 3
const NUDGE_SNOOZED_KEY = 'backupNudgeSnoozedUntil'
const DAY = 86_400_000

export type BackupNudge = { kind: 'never' } | { kind: 'stale'; days: number }

/**
 * Whether to suggest a backup, and why. Never backed up: once real use is 3+ days old (sample data
 * doesn't count, see usage.ts). Backed up before: once the last backup is 14+ days old. Not while
 * snoozed, and not when there's nothing to back up.
 */
export function backupNudge(s: {
  now: number
  hasTasks: boolean
  firstUsedAt?: number
  lastBackupAt?: number
  snoozedUntil?: number
}): BackupNudge | null {
  if (!s.hasTasks || (s.snoozedUntil !== undefined && s.snoozedUntil > s.now)) return null
  if (s.lastBackupAt === undefined) {
    return s.firstUsedAt !== undefined && s.now - s.firstUsedAt >= NUDGE_GRACE_DAYS * DAY ? { kind: 'never' } : null
  }
  const days = Math.floor((s.now - s.lastBackupAt) / DAY)
  return days >= BACKUP_NUDGE_DAYS ? { kind: 'stale', days } : null
}

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

/** The data a restore replaces, as stored, plus when the last backup was; see `snapshot()`. */
export interface Snapshot {
  tasks: Task[]
  projects: Label[]
  tags: Label[]
  attachments: Attachment[]
  lastBackupAt?: number
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
  const usage = createUsage(db)

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

    /** Checks a parsed file is a backup this app can restore, and says what's in it. Throws if not. */
    inspect(raw: unknown): { tasks: number; attachments: number } {
      const data = validate(raw)
      return { tasks: data.tasks.length, attachments: data.attachments.length }
    },

    /**
     * Replaces all tasks, projects, tags and attachments with the backup's contents. The data now
     * matches the file, so the file counts as the last backup, and a restore counts as real use.
     */
    async importData(raw: unknown, now = Date.now()): Promise<{ tasks: number; attachments: number }> {
      const data = validate(raw)
      const attachments: Attachment[] = data.attachments.map(({ blobBase64, blobType, ...rest }) =>
        blobBase64 !== undefined ? { ...rest, blob: base64ToBlob(blobBase64, blobType ?? '') } : rest,
      )
      const exportedAt = Date.parse(data.exportedAt)
      await db.transaction('rw', [db.tasks, db.projects, db.tags, db.attachments, db.meta], async () => {
        await Promise.all([db.tasks.clear(), db.projects.clear(), db.tags.clear(), db.attachments.clear()])
        await db.tasks.bulkAdd(data.tasks)
        await db.projects.bulkAdd(data.projects)
        await db.tags.bulkAdd(data.tags)
        await db.attachments.bulkAdd(attachments)
        // A file with no readable date (hand-edited) still restores; "Last backup" is just left as it was.
        if (Number.isFinite(exportedAt)) await meta.set(LAST_BACKUP_KEY, Math.min(exportedAt, now))
        if (data.tasks.length) await usage.noteUse(now)
      })
      return { tasks: data.tasks.length, attachments: attachments.length }
    },

    /**
     * Everything a restore would replace, held in memory as it is (files stay Blobs), so a restore
     * can be undone. Not a backup: it doesn't move "Last backup", and it's gone with the page.
     */
    async snapshot(): Promise<Snapshot> {
      const [tasks, projects, tags, attachments, lastBackupAt] = await Promise.all([
        db.tasks.toArray(),
        db.projects.toArray(),
        db.tags.toArray(),
        db.attachments.toArray(),
        meta.get<number>(LAST_BACKUP_KEY),
      ])
      return { tasks, projects, tags, attachments, lastBackupAt }
    },

    /** Puts a snapshot back exactly, "Last backup" included (cleared if there was none then). */
    async restoreSnapshot(s: Snapshot): Promise<void> {
      await db.transaction('rw', [db.tasks, db.projects, db.tags, db.attachments, db.meta], async () => {
        await Promise.all([db.tasks.clear(), db.projects.clear(), db.tags.clear(), db.attachments.clear()])
        await db.tasks.bulkAdd(s.tasks)
        await db.projects.bulkAdd(s.projects)
        await db.tags.bulkAdd(s.tags)
        await db.attachments.bulkAdd(s.attachments)
        if (s.lastBackupAt === undefined) await db.meta.delete(LAST_BACKUP_KEY)
        else await meta.set(LAST_BACKUP_KEY, s.lastBackupAt)
      })
    },

    /**
     * Whether the tasks, projects, tags and attachments are still exactly as in the snapshot, so
     * putting an older one back would lose nothing made since. Files compare by name, type and size.
     */
    async unchangedSince(s: Snapshot): Promise<boolean> {
      return fingerprint(await this.snapshot()) === fingerprint(s)
    },

    lastBackupAt: () => meta.get<number>(LAST_BACKUP_KEY),

    /** The backup nudge stays hidden until this time. */
    nudgeSnoozedUntil: () => meta.get<number>(NUDGE_SNOOZED_KEY),
    snoozeNudge: (until: number) => meta.set(NUDGE_SNOOZED_KEY, until),
  }
}

/** The snapshot's rows as one string, in id order, with each file reduced to its type and size. */
function fingerprint(s: Snapshot): string {
  const byId = <T extends { id: string }>(rows: T[]) => [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const files = s.attachments.map(({ blob, ...rest }) => ({ ...rest, blob: blob ? [blob.type, blob.size] : null }))
  return JSON.stringify([byId(s.tasks), byId(s.projects), byId(s.tags), byId(files)])
}

/** What a person sees when a file can't be restored: what's wrong, and which file to pick instead. */
export const NOT_A_BACKUP = 'This file isn’t a Task Tracker backup. Choose a file you downloaded from Backup & restore.'
export const NEWER_BACKUP = 'This backup comes from a newer version of Task Tracker. Reload the app to update it, then try again.'

function validate(raw: unknown): BackupFile {
  // The specific reason stays on `cause` for debugging; the message stays in the person's words.
  const fail = (why: string, message = NOT_A_BACKUP): never => {
    throw new Error(message, { cause: why })
  }
  if (!raw || typeof raw !== 'object') fail('not a JSON object')
  const d = raw as Partial<BackupFile>
  if (d.app !== BACKUP_APP) fail('wrong app')
  if (typeof d.version !== 'number') fail('no version')
  if (d.version! > BACKUP_VERSION) fail(`unsupported version ${String(d.version)}`, NEWER_BACKUP)
  for (const key of ['tasks', 'projects', 'tags', 'attachments'] as const) {
    if (!Array.isArray(d[key])) fail(`missing ${key}`)
  }
  if (!d.tasks!.every((t) => t && typeof t.id === 'string' && typeof t.title === 'string')) fail('a task is malformed')
  // Fill in list fields so older or hand-edited backups still load.
  const tasks = d.tasks!.map((t) => ({ ...t, tagIds: t.tagIds ?? [], checklist: t.checklist ?? [], reminders: t.reminders ?? [] }))
  return { ...(d as BackupFile), tasks }
}

export const backup = createBackup()
