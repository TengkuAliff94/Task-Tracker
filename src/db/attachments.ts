import type { Attachment } from '../types'
import { db as defaultDb, type TaskTrackerDB } from './db'

export const MAX_FILE_BYTES = 10 * 1024 * 1024

/** An attachment the task form has queued but not yet saved. */
export type PendingAttachment =
  | { kind: 'link'; url: string; name: string }
  | { kind: 'file'; file: File }

/** Returns a normalised http(s) URL, or throws. Adds https:// when no scheme is given. */
export function normaliseUrl(input: string): string {
  const raw = input.trim()
  if (!raw) throw new Error('Enter a link')
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new Error('That doesn’t look like a valid link')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http and https links are allowed')
  return url.href
}

export function checkFileSize(file: Blob): void {
  if (file.size > MAX_FILE_BYTES) throw new Error(`Files must be ${MAX_FILE_BYTES / 1024 / 1024} MB or smaller`)
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function createAttachmentRepo(db: TaskTrackerDB = defaultDb) {
  return {
    listForTask: (taskId: string) => db.attachments.where('taskId').equals(taskId).sortBy('createdAt'),

    /** Number of attachments per task id, without loading file contents. */
    async countsByTask(): Promise<Map<string, number>> {
      const counts = new Map<string, number>()
      for (const taskId of (await db.attachments.orderBy('taskId').keys()) as string[]) {
        counts.set(taskId, (counts.get(taskId) ?? 0) + 1)
      }
      return counts
    },

    async addLink(taskId: string, url: string, name?: string, now = Date.now()): Promise<Attachment> {
      const href = normaliseUrl(url)
      const a: Attachment = { id: crypto.randomUUID(), taskId, kind: 'link', name: name?.trim() || href, url: href, createdAt: now }
      await db.attachments.add(a)
      return a
    },

    async addFile(taskId: string, file: Blob, name: string, now = Date.now()): Promise<Attachment> {
      checkFileSize(file)
      const a: Attachment = { id: crypto.randomUUID(), taskId, kind: 'file', name, blob: file, size: file.size, createdAt: now }
      await db.attachments.add(a)
      return a
    },

    /** Saves what the task form queued: new attachments to add and existing ids to remove. */
    async apply(taskId: string, add: PendingAttachment[], removeIds: string[]): Promise<void> {
      await db.transaction('rw', db.attachments, async () => {
        if (removeIds.length) await db.attachments.bulkDelete(removeIds)
        for (const p of add) {
          if (p.kind === 'link') await this.addLink(taskId, p.url, p.name)
          else await this.addFile(taskId, p.file, p.file.name)
        }
      })
    },
  }
}

export const attachmentRepo = createAttachmentRepo()
