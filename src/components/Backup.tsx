import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DatabaseBackup, Download, Upload } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { backup, BACKUP_NUDGE_DAYS } from '../db/backup'
import { toDateInput } from '../lib/deadline'
import { btn } from '../ui'
import { Dialog } from './Dialog'
import { SampleDataButton } from './SampleDataButton'

const DAY = 86_400_000
const SNOOZE_DAYS = 3

async function downloadBackup() {
  const data = await backup.exportData()
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `task-tracker-backup-${toDateInput(new Date())}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function useLastBackup() {
  return useLiveQuery(async () => ({ at: await backup.lastBackupAt() }), [])
}

export function BackupDialog({ onClose }: { onClose: () => void }) {
  const last = useLastBackup()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function exportNow() {
    setBusy(true)
    try {
      await downloadBackup()
      setMessage({ ok: true, text: 'Backup downloaded.' })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  async function importFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(await file.text())
      } catch {
        throw new Error('That file isn’t valid JSON.')
      }
      const incoming = Array.isArray((parsed as { tasks?: unknown[] })?.tasks) ? (parsed as { tasks: unknown[] }).tasks.length : 0
      const current = await taskRepo.countAll()
      const ok = confirm(
        `Replace everything in the app with this backup?\n\n` +
          `Now: ${current} task(s), including any in Trash.\nBackup: ${incoming} task(s).\n\n` +
          `Your current data will be lost. Export a backup first if you might need it.`,
      )
      if (!ok) return
      const result = await backup.importData(parsed)
      setMessage({ ok: true, text: `Restored ${result.tasks} task(s) and ${result.attachments} attachment(s).` })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <Dialog title="Backup & restore" onClose={onClose}>
      <div className="space-y-5 text-sm">
        <p className="text-muted">
          Your tasks live only in this browser. Clearing site data or switching browsers loses them, so download a backup now and then.
        </p>
        <p>
          Last backup:{' '}
          <strong>{last?.at ? new Date(last.at).toLocaleString('en-GB', { hour12: false }) : 'never'}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportNow} disabled={busy} className={btn.primary}>
            <Download className="size-4" /> Download backup
          </button>
          <button onClick={() => fileInput.current?.click()} disabled={busy} className={btn.secondary}>
            <Upload className="size-4" /> Restore from file…
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
        <p className="text-xs text-muted">The backup is one JSON file with all tasks, projects, tags and attachments.</p>
        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-muted">Want to explore? Add example tasks that show off every feature. Your own tasks are kept.</p>
          <SampleDataButton onLoaded={(n) => setMessage({ ok: true, text: `Added ${n} sample tasks.` })} />
        </div>
        {message && <p className={message.ok ? 'text-primary' : 'text-danger'}>{message.text}</p>}
      </div>
    </Dialog>
  )
}

/** Suggests a backup when there's never been one (after a few days of use) or the last is old. */
export function BackupNudge({ oldestTaskAt, onOpen }: { oldestTaskAt?: number; onOpen: () => void }) {
  const state = useLiveQuery(
    async () => ({ last: await backup.lastBackupAt(), snoozedUntil: await backup.nudgeSnoozedUntil() }),
    [],
  )
  if (!state || oldestTaskAt === undefined) return null
  const now = Date.now()
  if (state.snoozedUntil && state.snoozedUntil > now) return null

  let text: string
  if (state.last === undefined) {
    if (now - oldestTaskAt < SNOOZE_DAYS * DAY) return null
    text = 'You haven’t backed up your tasks yet.'
  } else {
    const days = Math.floor((now - state.last) / DAY)
    if (days < BACKUP_NUDGE_DAYS) return null
    text = `Your last backup was ${days} days ago.`
  }

  return (
    <div role="status" className="mb-4 flex animate-fade-up flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-xs">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <DatabaseBackup className="size-4" aria-hidden />
      </span>
      <span className="flex-1">{text}</span>
      <button onClick={onOpen} className={btn.small}>
        Back up now
      </button>
      <button onClick={() => backup.snoozeNudge(now + SNOOZE_DAYS * DAY)} className={`${btn.small} text-muted`}>
        Remind me later
      </button>
    </div>
  )
}
