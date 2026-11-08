import { AlertCircle, CalendarClock, CircleCheck, CircleDashed, type LucideIcon } from 'lucide-react'
import { isOverdue, toDateInput } from '../lib/deadline'
import type { Task } from '../types'
import { card, panel } from '../ui'

interface Stat {
  label: string
  value: number
  icon: LucideIcon
  tone: string
}

/** At-a-glance counts above the list, with a completion meter. Read-only. */
export function Overview({ tasks, now }: { tasks: Task[]; now: Date }) {
  const today = toDateInput(now)
  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.length - open.length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const stats: Stat[] = [
    { label: 'Open', value: open.length, icon: CircleDashed, tone: panel.info },
    { label: 'Due today', value: open.filter((t) => t.deadline?.date === today).length, icon: CalendarClock, tone: panel.warning },
    { label: 'Past due', value: open.filter((t) => isOverdue(t, now)).length, icon: AlertCircle, tone: panel.danger },
    { label: 'Completed', value: done, icon: CircleCheck, tone: panel.calm },
  ]

  return (
    <section aria-label="Overview" className="mb-5 grid grid-cols-4 gap-2 sm:gap-2.5">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={`${card} min-w-0 p-2.5 sm:p-3.5`}>
          <div className="flex items-center justify-between">
            <span className="truncate text-[11px] font-medium text-muted sm:text-xs">{label}</span>
            <span className={`grid size-7 shrink-0 place-items-center rounded-lg max-sm:hidden ${tone}`}>
              <Icon className="size-4" aria-hidden />
            </span>
          </div>
          <div className="mt-1.5 flex items-end gap-2">
            <span className="font-display text-xl leading-none font-bold tracking-tight tabular-nums sm:text-2xl">{value}</span>
            {label === 'Completed' && (
              <span className="mb-0.5 text-[11px] text-muted tabular-nums sm:text-xs">{pct}%</span>
            )}
          </div>
          {label === 'Completed' && (
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-subtle sm:mt-2.5"
              role="progressbar"
              aria-label="Tasks completed"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
