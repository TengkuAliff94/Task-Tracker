import { Bell, X } from 'lucide-react'
import { ToastPanel } from './Toast'
import { attentionAction, INVERTED_PANEL, panel, toastDismiss } from '../ui'
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
    <div role="status" className={`mb-4 animate-fade-up rounded-panel p-5 text-sm ${panel.warning}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <strong className="inline-flex items-center gap-2 font-display text-base font-bold">
          <Bell className="size-5" aria-hidden />
          {missed.length} reminder{missed.length === 1 ? '' : 's'} went off while you were away
        </strong>
        <button onClick={onDismissAll} className={`${attentionAction} ${INVERTED_PANEL.warning}`}>
          Dismiss all
        </button>
      </div>
      <ul className="space-y-0.5 pl-7">
        {missed.map((a) => (
          <li key={keyOf(a)}>
            <button onClick={() => onOpen(a.task)} className="hover:underline">
              {a.task.title}
            </button>
            <span className="opacity-80"> · {time(a.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReminderToast({ alert, onDismiss, onOpen }: { alert: Alert; onDismiss: () => void; onOpen: () => void }) {
  return (
    <ToastPanel role="alert" className={`p-3.5 ${panel.warning}`}>
      <div className="flex items-start gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/10">
          <Bell className="size-4" aria-hidden />
        </span>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium">{alert.task.title}</div>
          <div className="text-xs opacity-80">Reminder · {time(alert.at)}</div>
        </button>
        <button onClick={onDismiss} aria-label="Dismiss" className={toastDismiss}>
          <X className="size-4" />
        </button>
      </div>
    </ToastPanel>
  )
}

export { keyOf as alertKey }
