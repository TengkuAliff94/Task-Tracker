import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DatabaseBackup, Download, Upload } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { backup, backupNudge, NUDGE_GRACE_DAYS } from '../db/backup'
import { persistence, type StorageProtection } from '../db/persistence'
import { usage } from '../db/usage'
import { formatDateTime, toDateInput } from '../lib/deadline'
import { plural } from '../lib/utils'
import { useConfirm } from '../hooks/useConfirm'
import { attentionAction, attentionQuiet, btn, INVERTED_PANEL, panel } from '../ui'
import { CountList } from './ConfirmDialog'
import { Dialog } from './Dialog'
import { SampleDataButton } from './SampleDataButton'

const DAY = 86_400_000

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

type Message = { ok: boolean; text: string } | null

/**
 * A result line that screen readers announce. While empty it's visually hidden but stays in the
 * accessibility tree (`display: none` would take it out), so the first message is read too.
 */
function MessageLine({ message, className = '' }: { message: Message; className?: string }) {
  return (
    <p role="status" className={`empty:sr-only ${message?.ok === false ? 'text-danger' : 'text-primary'} ${className}`}>
      {message?.text}
    </p>
  )
}

const PROTECTION: Record<StorageProtection, { label: string; detail: string }> = {
  protected: { label: 'Protected', detail: 'The browser won’t clear your tasks to free up space.' },
  unprotected: { label: 'Not protected', detail: 'The browser may clear your tasks if the device runs low on space.' },
  unknown: { label: 'Not reported', detail: 'This browser doesn’t say whether it keeps your tasks when space runs low.' },
}

/** Whether the browser has agreed to keep this site's storage, with a way to ask while it hasn't. */
function StorageStatus() {
  const [status, setStatus] = useState<StorageProtection>()
  /** How many times in a row a request was turned down, so a repeat refusal still changes the line (and is read out). */
  const [refusals, setRefusals] = useState(0)
  const asking = useRef(false)
  const labelRef = useRef<HTMLSpanElement>(null)
  /** Set when a request is granted: the Ask button is about to go, so focus moves to the new state. */
  const focusLabel = useRef(false)

  // In the same commit that removes the button, so focus never rests on the page in between.
  useLayoutEffect(() => {
    if (!focusLabel.current || !status || status === 'unprotected') return
    focusLabel.current = false
    labelRef.current?.focus()
  }, [status])

  useEffect(() => {
    let live = true
    void persistence.status().then((s) => live && setStatus(s))
    // A request made elsewhere (after a restore, say) can change the answer while this is open.
    const unsubscribe = persistence.subscribe((s) => live && setStatus(s))
    return () => {
      live = false
      unsubscribe()
    }
  }, [])

  async function ask() {
    // A ref, not `disabled`: disabling the focused button would drop focus while Firefox's prompt is up.
    if (asking.current) return
    asking.current = true
    try {
      // Set before asking: the answer can also arrive through the subscription above, first.
      focusLabel.current = true
      const result = await persistence.request()
      if (result === 'unprotected') focusLabel.current = false
      setStatus(result)
      setRefusals((n) => (result === 'unprotected' ? n + 1 : 0))
    } finally {
      asking.current = false
    }
  }

  if (!status) return <span className="font-normal text-muted">Checking…</span>
  const { label, detail } = PROTECTION[status]
  return (
    <span className="flex flex-col items-start gap-1">
      <span ref={labelRef} tabIndex={-1} className="rounded-sm">
        {label}
      </span>
      <span className="font-normal text-muted" aria-live="polite">
        {status === 'unprotected' && refusals > 0
          ? `${refusals > 1 ? 'Still not granted' : 'Not granted'}. Some browsers decide this for themselves; installing the app often helps.`
          : detail}
      </span>
      {status === 'unprotected' && (
        <button
          type="button"
          onClick={ask}
          className="rounded-sm text-left font-medium text-primary underline decoration-primary/40 underline-offset-3 transition-[text-decoration-color] duration-200 hover:decoration-primary"
        >
          {refusals > 0 ? 'Ask again' : 'Ask the browser to protect it'}
        </button>
      )}
    </span>
  )
}

export function BackupDialog({ onClose }: { onClose: () => void }) {
  const last = useLastBackup()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message>(null)
  const [sampleMessage, setSampleMessage] = useState<Message>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDialog, ask] = useConfirm()
  const tryHeading = useId()

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
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(await file.text())
      } catch {
        throw new Error('That file isn’t valid JSON.')
      }
      // A file that isn't a backup is turned away here, before anyone is asked to replace their data with it.
      const incoming = backup.inspect(parsed)
      const current = await taskRepo.countAll()
      setMessage(null)
      const ok = await ask({
        title: 'Replace everything with this backup?',
        body: (
          <>
            <CountList
              rows={[
                ['Now', `${plural(current, 'task')}, including any in Trash`],
                ['Backup', `${plural(incoming.tasks, 'task')}, ${plural(incoming.attachments, 'attachment')}`],
              ]}
            />
            <p>Your current data will be lost. Download a backup first if you might need it.</p>
          </>
        ),
        confirmLabel: 'Replace everything',
        danger: true,
      })
      if (!ok) return
      // Busy only now: disabling the focused Restore button any sooner would leave the question nowhere to return focus.
      setBusy(true)
      const result = await backup.importData(parsed)
      setMessage({ ok: true, text: `Restored ${plural(result.tasks, 'task')} and ${plural(result.attachments, 'attachment')}.` })
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
        <CountList
          rows={[
            ['Last backup', last ? (last.at ? formatDateTime(new Date(last.at)) : 'Never') : '…'],
            ['Storage', <StorageStatus key="storage" />],
          ]}
        />
        <div className="space-y-2">
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
          <MessageLine message={message} />
        </div>
        {/* Demo content, kept apart from backup and restore (extra space and its own heading, no rule) so it never reads as a way to restore data. */}
        <section aria-labelledby={tryHeading} className="space-y-2 pt-3">
          <h3 id={tryHeading} className="text-sm font-bold">
            Try the app
          </h3>
          <p className="text-muted">Adds example tasks that show off every feature, alongside your own. Nothing is replaced.</p>
          {/* Button and result share a wrapper, so the empty (visually hidden) line leaves no gap at the bottom. */}
          <div>
            <SampleDataButton
              variant="ghost"
              onLoaded={(n) => setSampleMessage({ ok: true, text: `Added ${plural(n, 'sample task')}.` })}
            />
            <MessageLine message={sampleMessage} className="mt-2" />
          </div>
        </section>
      </div>
      {confirmDialog}
    </Dialog>
  )
}

/** Suggests a backup when there's never been one (after a few days of real use) or the last is old. */
export function BackupNudge({ hasTasks, onOpen }: { hasTasks: boolean; onOpen: () => void }) {
  const state = useLiveQuery(
    async () => ({
      last: await backup.lastBackupAt(),
      snoozedUntil: await backup.nudgeSnoozedUntil(),
      firstUsedAt: await usage.firstUsedAt(),
    }),
    [],
  )
  if (!state) return null
  const now = Date.now()
  const nudge = backupNudge({
    now,
    hasTasks,
    firstUsedAt: state.firstUsedAt,
    lastBackupAt: state.last,
    snoozedUntil: state.snoozedUntil,
  })
  if (!nudge) return null
  const text = nudge.kind === 'never' ? 'You haven’t backed up your tasks yet.' : `Your last backup was ${nudge.days} days ago.`

  return (
    <div role="status" className={`flex animate-fade-up flex-wrap items-center gap-3 rounded-panel px-5 py-4 text-sm ${panel.info}`}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-current/15">
        <DatabaseBackup className="size-4.5" aria-hidden />
      </span>
      <span className="flex-1 font-medium">{text}</span>
      <button onClick={onOpen} className={`${attentionAction} ${INVERTED_PANEL.info}`}>
        Back up now
      </button>
      <button onClick={() => backup.snoozeNudge(now + NUDGE_GRACE_DAYS * DAY)} className={attentionQuiet}>
        Remind me later
      </button>
    </div>
  )
}
