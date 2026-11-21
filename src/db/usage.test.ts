import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FIRST_USED_KEY, TaskTrackerDB } from './db'
import { BACKUP_NUDGE_DAYS, backupNudge, createBackup, NUDGE_GRACE_DAYS } from './backup'
import { persistence } from './persistence'
import { createSampleData } from './sample'
import { createTaskRepo } from './tasks'
import { createUsage } from './usage'

const DAY = 86_400_000
const NOW = 1_000 * DAY

describe('backup nudge rule', () => {
  const base = { now: NOW, hasTasks: true }

  it('waits for real use: nothing until the person has added a task of their own', () => {
    expect(backupNudge({ ...base, firstUsedAt: undefined })).toBeNull()
  })

  it('asks for a first backup once real use is 3 days old, not before', () => {
    expect(backupNudge({ ...base, firstUsedAt: NOW - NUDGE_GRACE_DAYS * DAY + 1 })).toBeNull()
    expect(backupNudge({ ...base, firstUsedAt: NOW - NUDGE_GRACE_DAYS * DAY })).toEqual({ kind: 'never' })
  })

  it('after a backup, waits until it is 14 days old and says how old', () => {
    const firstUsedAt = NOW - 100 * DAY
    expect(backupNudge({ ...base, firstUsedAt, lastBackupAt: NOW - (BACKUP_NUDGE_DAYS - 1) * DAY })).toBeNull()
    expect(backupNudge({ ...base, firstUsedAt, lastBackupAt: NOW - 20 * DAY })).toEqual({ kind: 'stale', days: 20 })
  })

  it('counts an old backup even when "first used" was never recorded', () => {
    expect(backupNudge({ ...base, lastBackupAt: NOW - 30 * DAY })).toEqual({ kind: 'stale', days: 30 })
  })

  it('stays quiet while snoozed, and comes back when the snooze ends', () => {
    const due = { ...base, firstUsedAt: NOW - 10 * DAY }
    expect(backupNudge({ ...due, snoozedUntil: NOW + 1 })).toBeNull()
    expect(backupNudge({ ...due, snoozedUntil: NOW })).toEqual({ kind: 'never' })
  })

  it('stays quiet when there is nothing to back up', () => {
    expect(backupNudge({ ...base, hasTasks: false, firstUsedAt: NOW - 10 * DAY })).toBeNull()
  })
})

describe('first use', () => {
  let db: TaskTrackerDB
  beforeEach(() => {
    db = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
  })

  it('keeps the first time it is noted', async () => {
    const usage = createUsage(db)
    expect(await usage.firstUsedAt()).toBeUndefined()
    await usage.noteUse(5 * DAY)
    await usage.noteUse(9 * DAY)
    expect(await usage.firstUsedAt()).toBe(5 * DAY)
  })

  it('starts with the first task the person adds', async () => {
    await createTaskRepo(db).create({ title: 'Mine' }, 7 * DAY)
    expect(await createUsage(db).firstUsedAt()).toBe(7 * DAY)
  })

  it('does not start with sample data, however far back its tasks are dated', async () => {
    await createSampleData(db).load(new Date(NOW))
    expect(await db.tasks.count()).toBeGreaterThan(0)
    expect(await createUsage(db).firstUsedAt()).toBeUndefined()

    // ...so on a fresh install the nudge stays away, even with tasks dated weeks ago.
    const oldest = Math.min(...(await db.tasks.toArray()).map((t) => t.createdAt))
    expect(NOW - oldest).toBeGreaterThan(NUDGE_GRACE_DAYS * DAY)
    expect(backupNudge({ now: NOW, hasTasks: true, firstUsedAt: await createUsage(db).firstUsedAt() })).toBeNull()
  })

  it('a task added after sample data starts the count from that moment', async () => {
    await createSampleData(db).load(new Date(NOW))
    await createTaskRepo(db).create({ title: 'Mine' }, NOW + DAY)
    expect(await createUsage(db).firstUsedAt()).toBe(NOW + DAY)
  })
})

describe('restoring a backup', () => {
  let db: TaskTrackerDB
  beforeEach(() => {
    db = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
  })

  async function fileFrom(exportedAt: number) {
    const source = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
    await createTaskRepo(source).create({ title: 'From the file' })
    return JSON.parse(JSON.stringify(await createBackup(source).exportData(new Date(exportedAt))))
  }

  it('counts the file as the last backup, and the restore as real use', async () => {
    const file = await fileFrom(NOW - 2 * DAY)
    const b = createBackup(db)
    await b.importData(file, NOW)
    expect(await b.lastBackupAt()).toBe(NOW - 2 * DAY)
    expect(await createUsage(db).firstUsedAt()).toBe(NOW)
  })

  it('never records a backup in the future, if the file came from a clock that ran ahead', async () => {
    const b = createBackup(db)
    await b.importData(await fileFrom(NOW + 5 * DAY), NOW)
    expect(await b.lastBackupAt()).toBe(NOW)
  })

  it('still restores a file with no readable date, leaving "last backup" alone', async () => {
    const file = { ...(await fileFrom(NOW)), exportedAt: 'whenever' }
    const b = createBackup(db)
    expect(await b.importData(file, NOW)).toEqual({ tasks: 1, attachments: 0 })
    expect(await b.lastBackupAt()).toBeUndefined()
  })
})

describe('upgrading an install from before "first used" was recorded', () => {
  it('starts the count from the oldest task, so existing users keep their reminder', async () => {
    const name = `test-${crypto.randomUUID()}`
    const old = new Dexie(name)
    old.version(1).stores({ tasks: 'id, status, priority, projectId, *tagIds, createdAt, deletedAt', projects: 'id, name', tags: 'id, name', attachments: 'id, taskId' })
    old.version(2).stores({ meta: 'key' })
    await old.table('tasks').bulkAdd([
      { id: 'b', title: 'Newer', createdAt: 9 * DAY, tagIds: [] },
      { id: 'a', title: 'Older', createdAt: 4 * DAY, tagIds: [] },
    ])
    old.close()

    const db = new TaskTrackerDB(name)
    expect((await db.meta.get(FIRST_USED_KEY))?.value).toBe(4 * DAY)
    expect(await db.tasks.count()).toBe(2)
  })

  it('leaves an empty install with no "first used" time', async () => {
    const name = `test-${crypto.randomUUID()}`
    const old = new Dexie(name)
    old.version(2).stores({ tasks: 'id, createdAt', meta: 'key' })
    await old.open()
    old.close()
    expect(await new TaskTrackerDB(name).meta.get(FIRST_USED_KEY)).toBeUndefined()
  })
})

describe('storage protection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubBrowser({ persisted = false, grants = true, permission = 'prompt' } = {}) {
    let kept = persisted
    const persist = vi.fn(async () => (kept = kept || grants))
    vi.stubGlobal('navigator', {
      storage: { persisted: async () => kept, persist },
      permissions: { query: async () => ({ state: permission }) },
    })
    return persist
  }

  it('reports "unknown" where the browser has no storage manager', async () => {
    vi.stubGlobal('navigator', {})
    expect(await persistence.status()).toBe('unknown')
    expect(await persistence.request()).toBe('unknown')
  })

  it('reports what the browser says, and what a request got', async () => {
    stubBrowser({ grants: false })
    expect(await persistence.status()).toBe('unprotected')
    expect(await persistence.request()).toBe('unprotected')
    stubBrowser({ grants: true })
    expect(await persistence.request()).toBe('protected')
  })

  it('asks right after the first own task', async () => {
    const persist = stubBrowser()
    await persistence.keep({ firstUse: true })
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('on a later launch, asks only when no prompt would show', async () => {
    const persist = stubBrowser({ permission: 'prompt' })
    await persistence.keep({ firstUse: false })
    expect(persist).not.toHaveBeenCalled()

    const granted = stubBrowser({ permission: 'granted' })
    await persistence.keep({ firstUse: false })
    expect(granted).toHaveBeenCalledTimes(1)
  })

  it('does not ask again once storage is protected', async () => {
    const persist = stubBrowser({ persisted: true })
    await persistence.keep({ firstUse: true })
    expect(persist).not.toHaveBeenCalled()
  })

  it('treats a browser that throws on the permission name as "would prompt"', async () => {
    const persist = vi.fn(async () => true)
    vi.stubGlobal('navigator', {
      storage: { persisted: async () => false, persist },
      permissions: { query: async () => Promise.reject(new TypeError('unknown permission')) },
    })
    await persistence.keep({ firstUse: false })
    expect(persist).not.toHaveBeenCalled()
  })
})
