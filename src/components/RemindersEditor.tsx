import { useState } from 'react'
import { describeReminder, MAX_REMINDERS, RELATIVE_PRESETS } from '../lib/reminders'
import type { Reminder } from '../types'

interface Props {
  value: Reminder[]
  onChange: (r: Reminder[]) => void
  hasDeadline: boolean
  className: string
}

const ABSOLUTE = 'absolute'

export function RemindersEditor({ value, onChange, hasDeadline, className }: Props) {
  const [choice, setChoice] = useState('')
  const [at, setAt] = useState('')

  function add(r: Reminder) {
    onChange([...value, r])
    setChoice('')
    setAt('')
  }

  return (
    <div className="space-y-1.5">
      {value.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800">
          <span>
            🔔 {describeReminder(r)}
            {r.kind === 'relative' && !hasDeadline && <span className="text-xs text-amber-600"> (needs a deadline)</span>}
          </span>
          <button
            type="button"
            aria-label="Remove reminder"
            onClick={() => onChange(value.filter((x) => x.id !== r.id))}
            className="text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
      ))}

      {value.length < MAX_REMINDERS && (
        <div className="flex gap-2">
          <select
            aria-label="Add reminder"
            value={choice}
            onChange={(e) => {
              const v = e.target.value
              if (v && v !== ABSOLUTE) add({ id: crypto.randomUUID(), kind: 'relative', minutesBefore: Number(v) })
              else setChoice(v)
            }}
            className={className}
          >
            <option value="">+ Add reminder…</option>
            {RELATIVE_PRESETS.map((p) => (
              <option key={p.minutes} value={p.minutes} disabled={!hasDeadline}>
                {p.label}
              </option>
            ))}
            <option value={ABSOLUTE}>At a specific time…</option>
          </select>
          {choice === ABSOLUTE && (
            <>
              <input
                type="datetime-local"
                aria-label="Reminder time"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className={className}
              />
              <button
                type="button"
                disabled={!at}
                onClick={() => add({ id: crypto.randomUUID(), kind: 'absolute', at: new Date(at).getTime() })}
                className="rounded-md bg-slate-200 px-3 text-sm disabled:opacity-50 dark:bg-slate-700"
              >
                Add
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
