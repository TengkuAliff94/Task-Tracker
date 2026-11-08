import { AlertCircle, CalendarClock, CircleCheck, CircleDashed, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { isOverdue, toDateInput } from '../lib/deadline'
import type { Task } from '../types'
import { panel } from '../ui'
import { CountUp } from './motion/CountUp'
import { DURATION, EASE_OUT_SOFT } from './motion/presets'
import { Reveal } from './motion/Reveal'

interface Stat {
  label: string
  value: number
  icon: LucideIcon
  tone: string
  /** Draws the eye: the icon pulses. */
  alert?: boolean
  /** Shows a percentage and a completion meter (0–100). */
  progress?: number
}

/** How many tiles the Overview shows, so whatever reveals after it can stagger in behind them. */
export const OVERVIEW_TILE_COUNT = 4

/**
 * At-a-glance counts as colour tiles, with a completion meter. Read-only. Numbers count up when
 * they first show and whenever they change. Tiles reveal in turn, starting at `firstIndex`.
 */
export function Overview({ tasks, now, firstIndex }: { tasks: Task[]; now: Date; firstIndex: number }) {
  const today = toDateInput(now)
  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.length - open.length
  const pastDue = open.filter((t) => isOverdue(t, now)).length

  const stats: Stat[] = [
    { label: 'Open', value: open.length, icon: CircleDashed, tone: panel.info },
    { label: 'Due today', value: open.filter((t) => t.deadline?.date === today).length, icon: CalendarClock, tone: panel.warning },
    // Calm when nothing is late; the alarm colour only when something is.
    { label: 'Past due', value: pastDue, icon: AlertCircle, tone: pastDue ? panel.danger : panel.neutral, alert: pastDue > 0 },
    {
      label: 'Completed',
      value: done,
      icon: CircleCheck,
      tone: panel.calm,
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
  ]

  return (
    <section aria-label="Overview" className="grid h-full grid-cols-2 gap-3">
      {stats.map(({ label, value, icon: Icon, tone, alert, progress }, i) => (
        <Reveal key={label} index={firstIndex + i} className="min-w-0">
          <div className={`flex h-full flex-col rounded-panel p-4 transition-colors duration-200 sm:p-5 ${tone}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="truncate text-sm font-semibold">{label}</span>
              <Icon className={`size-5 shrink-0 ${alert ? 'motion-safe:animate-pulse' : ''}`} aria-hidden />
            </div>
            <div className="mt-auto flex items-end gap-2 pt-3">
              <CountUp value={value} className="font-display text-4xl leading-none font-extrabold tracking-tight tabular-nums sm:text-5xl" />
              {progress !== undefined && <span className="mb-1 text-sm font-semibold tabular-nums">{progress}%</span>}
            </div>
            {progress !== undefined && <Meter pct={progress} />}
          </div>
        </Reveal>
      ))}
    </section>
  )
}

/**
 * The completion bar. It fills smoothly to each new percentage (a horizontal scale, so only
 * transforms animate); under reduced motion it jumps straight there.
 */
function Meter({ pct }: { pct: number }) {
  const reduce = useReducedMotionConfig()
  return (
    <div
      className="mt-3 h-1.5 overflow-hidden rounded-full bg-current/20"
      role="progressbar"
      aria-label="Tasks completed"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full origin-left rounded-full bg-current"
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={reduce ? { duration: 0 } : { duration: DURATION.count, ease: EASE_OUT_SOFT }}
      />
    </div>
  )
}
