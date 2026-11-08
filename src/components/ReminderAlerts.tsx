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
    <div role="status" className="mb-4 animate-fade-up rounded-xl border border-accent/30 bg-accent/8 p-3.5 text-sm shadow-xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="inline-flex items-center gap-1.5">
          <Bell className="size-4 text-accent" aria-hidden />
          {missed.length} reminder{missed.length === 1 ? '' : 's'} went off while you were away
        </strong>
        <button onClick={onDismissAll} className="rounded-md px-2 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10">
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
    <div role="alert" className="animate-slide-in rounded-xl border border-line bg-raised p-3.5 shadow-pop">
      <div className="flex items-start gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent">
          <Bell className="size-4" aria-hidden />
        </span>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium">{alert.task.title}</div>
          <div className="text-xs text-muted">Reminder · {time(alert.at)}</div>
        </button>
        <button onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 text-muted transition-colors hover:bg-subtle hover:text-fg">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { keyOf as alertKey }
