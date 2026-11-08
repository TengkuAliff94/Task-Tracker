import type { Alert } from '../hooks/useReminders'
import type { Task } from '../types'

interface Props {
  alerts: Alert[]
  onDismiss: (a: Alert) => void
  onDismissAll: () => void
  onOpen: (task: Task) => void
}

const time = (at: number) =>
  new Date(at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: false })

/** Banner for reminders missed while the app was closed, plus toasts for ones that fire in-app. */
export function ReminderAlerts({ alerts, onDismiss, onDismissAll, onOpen }: Props) {
  const missed = alerts.filter((a) => a.missed)
  const live = alerts.filter((a) => !a.missed)

  return (
    <>
      {missed.length > 0 && (
        <div role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <div className="mb-1 flex items-center justify-between">
            <strong>
              🔔 {missed.length} reminder{missed.length === 1 ? '' : 's'} went off while you were away
            </strong>
            <button onClick={onDismissAll} className="text-xs text-amber-800 hover:underline dark:text-amber-300">
              Dismiss all
            </button>
          </div>
          <ul className="space-y-0.5">
            {missed.map((a) => (
              <li key={`${a.reminder.id}:${a.at}`}>
                <button onClick={() => onOpen(a.task)} className="hover:underline">
                  {a.task.title}
                </button>
                <span className="text-slate-500"> · {time(a.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {live.map((a) => (
          <Toast key={`${a.reminder.id}:${a.at}`} alert={a} onDismiss={() => onDismiss(a)} onOpen={() => onOpen(a.task)} />
        ))}
      </div>
    </>
  )
}

function Toast({ alert, onDismiss, onOpen }: { alert: Alert; onDismiss: () => void; onOpen: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-2">
        <span>🔔</span>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium">{alert.task.title}</div>
          <div className="text-xs text-slate-500">{time(alert.at)}</div>
        </button>
        <button onClick={onDismiss} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
          ×
        </button>
      </div>
    </div>
  )
}
