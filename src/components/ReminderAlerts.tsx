import { Bell, X } from 'lucide-react'
import type { Alert } from '../hooks/useReminders'
import type { Task } from '../types'

interface Props {
  alerts: Alert[]
  onDismiss: (a: Alert) => void
  onDismissAll: () => void
  onOpen: (task: Task) => void
}

const time = (at: number) => new Date(at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: false })
const keyOf = (a: Alert) => `${a.reminder.id}:${a.at}`

/** Banner for reminders missed while the app was closed. Ones that fire in-app become toasts. */
export function MissedRemindersBanner({ alerts, onDismissAll, onOpen }: Omit<Props, 'onDismiss'>) {
  const missed = alerts.filter((a) => a.missed)
  if (!missed.length) return null
  return (
    <div role="status" className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="inline-flex items-center gap-1.5">
          <Bell className="size-4 text-accent" aria-hidden />
          {missed.length} reminder{missed.length === 1 ? '' : 's'} went off while you were away
        </strong>
        <button onClick={onDismissAll} className="text-xs text-accent hover:underline">
          Dismiss all
        </button>
      </div>
      <ul className="space-y-0.5 pl-5.5">
        {missed.map((a) => (
          <li key={keyOf(a)}>
            <button onClick={() => onOpen(a.task)} className="hover:underline">
              {a.task.title}
            </button>
            <span className="text-muted"> · {time(a.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReminderToast({ alert, onDismiss, onOpen }: { alert: Alert; onDismiss: () => void; onOpen: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-line bg-surface p-3 shadow-lg">
      <div className="flex items-start gap-2">
        <Bell className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium">{alert.task.title}</div>
          <div className="text-xs text-muted">Reminder · {time(alert.at)}</div>
        </button>
        <button onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 text-muted hover:text-fg">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { keyOf as alertKey }
