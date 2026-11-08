import { beforeEach, describe, expect, it } from 'vitest'
import { TaskTrackerDB } from './db'
import { createTaskRepo } from './tasks'
import { createLabelRepo } from './labels'
import { createAttachmentRepo, MAX_FILE_BYTES, normaliseUrl } from './attachments'
import { createBackup } from './backup'
import { createReminderLog } from './reminders'

let db: TaskTrackerDB
let tasks: ReturnType<typeof createTaskRepo>
let attachments: ReturnType<typeof createAttachmentRepo>

beforeEach(() => {
  db = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
  tasks = createTaskRepo(db)
  attachments = createAttachmentRepo(db)
})

const DAY = 86_400_000

describe('trash', () => {
  it('counts stored tasks including Trash, and Trash on its own', async () => {
    const a = await tasks.create({ title: 'A' })
    await tasks.create({ title: 'B' })
    expect(await tasks.countAll()).toBe(2)
    expect(await tasks.countTrash()).toBe(0)

    await tasks.trash(a.id)
    expect(await tasks.countAll()).toBe(2)
    expect(await tasks.countTrash()).toBe(1)
  })

  it('trash hides, restore brings back', async () => {
    const t = await tasks.create({ title: 'A' })
    await tasks.trash(t.id, 1000)
    expect(await tasks.list()).toHaveLength(0)
    expect((await tasks.listTrash()).map((x) => x.id)).toEqual([t.id])
    await tasks.restore(t.id)
    expect(await tasks.list()).toHaveLength(1)
    expect((await tasks.get(t.id))?.deletedAt).toBeUndefined()
  })

  it('emptyTrash(30) only purges items older than 30 days, with their attachments', async () => {
    const now = 100 * DAY
    const old = await tasks.create({ title: 'old' })
    const recent = await tasks.create({ title: 'recent' })
    await attachments.addLink(old.id, 'example.com')
    await tasks.trash(old.id, now - 31 * DAY)
    await tasks.trash(recent.id, now - 5 * DAY)
    expect(await tasks.emptyTrash(30, now)).toBe(1)
    expect((await tasks.listTrash()).map((x) => x.title)).toEqual(['recent'])
    expect(await attachments.listForTask(old.id)).toHaveLength(0)
  })
})

describe('attachments', () => {
  it('normalises links and rejects other schemes', () => {
    expect(normaliseUrl('example.com/a')).toBe('https://example.com/a')
    expect(normaliseUrl('http://x.org')).toBe('http://x.org/')
    expect(() => normaliseUrl('javascript:alert(1)')).toThrow('Only http and https')
    expect(() => normaliseUrl('  ')).toThrow()
  })

  it('stores files and rejects ones over the limit', async () => {
    const t = await tasks.create({ title: 'A' })
    await attachments.addFile(t.id, new Blob(['hi'], { type: 'text/plain' }), 'hi.txt')
    const [a] = await attachments.listForTask(t.id)
    expect(a).toMatchObject({ name: 'hi.txt', size: 2, kind: 'file' })
    expect(await a.blob!.text()).toBe('hi')

    const big = new Blob([new Uint8Array(MAX_FILE_BYTES + 1)])
    await expect(attachments.addFile(t.id, big, 'big.bin')).rejects.toThrow('10 MB')
  })

  it('apply adds and removes in one go, and counts by task', async () => {
    const t = await tasks.create({ title: 'A' })
    const keep = await attachments.addLink(t.id, 'a.com')
    const drop = await attachments.addLink(t.id, 'b.com')
    await attachments.apply(t.id, [{ kind: 'link', url: 'c.com', name: 'C' }], [drop.id])
    const names = (await attachments.listForTask(t.id)).map((a) => a.name)
    expect(names).toEqual([keep.name, 'C'])
    expect((await attachments.countsByTask()).get(t.id)).toBe(2)
  })
})

describe('backup', () => {
  it('round-trips tasks, labels and file contents through JSON', async () => {
    const labels = createLabelRepo(db)
    const p = await labels.projects.create('Home')
    const t = await tasks.create({ title: 'Rent', projectId: p.id })
    await attachments.addFile(t.id, new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'application/octet-stream' }), 'b.bin')

    const b = createBackup(db)
    const json = JSON.stringify(await b.exportData(new Date(5000)))
    expect(await b.lastBackupAt()).toBe(5000)

    const fresh = new TaskTrackerDB(`test-${crypto.randomUUID()}`)
    await createTaskRepo(fresh).create({ title: 'will be replaced' })
    const result = await createBackup(fresh).importData(JSON.parse(json))
    expect(result).toEqual({ tasks: 1, attachments: 1 })

    const restored = await createTaskRepo(fresh).list()
    expect(restored.map((x) => x.title)).toEqual(['Rent'])
    expect((await createLabelRepo(fresh).projects.list())[0].name).toBe('Home')
    const [a] = await createAttachmentRepo(fresh).listForTask(t.id)
    expect(new Uint8Array(await a.blob!.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 255]))
    expect(a.blob!.type).toBe('application/octet-stream')
  })

  it('remembers when the backup nudge was snoozed until', async () => {
    const b = createBackup(db)
    expect(await b.nudgeSnoozedUntil()).toBeUndefined()
    await b.snoozeNudge(9000)
    expect(await b.nudgeSnoozedUntil()).toBe(9000)
    expect(await createBackup(db).nudgeSnoozedUntil()).toBe(9000)
  })

  it('rejects files that are not backups, leaving data untouched', async () => {
    await tasks.create({ title: 'keep me' })
    const b = createBackup(db)
    await expect(b.importData({ hello: 'world' })).rejects.toThrow('valid Task Tracker backup')
    await expect(b.importData({ app: 'task-tracker', version: 99 })).rejects.toThrow('unsupported version')
    expect(await tasks.list()).toHaveLength(1)
  })
})

describe('reminder log', () => {
  it('has no checked-up-to time until one is stored, then keeps the latest', async () => {
    const log = createReminderLog(db)
    expect(await log.checkedUpTo()).toBeUndefined()
    await log.markChecked(1000)
    await log.markChecked(2000)
    expect(await createReminderLog(db).checkedUpTo()).toBe(2000)
  })
})
