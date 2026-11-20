import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { formatDateTime } from '../lib/deadline'
import { describeReminder, MAX_REMINDERS, RELATIVE_PRESETS } from '../lib/reminders'
import type { Reminder } from '../types'
import { cn } from '../lib/utils'
import { btn } from '../ui'

interface Props {
  value: Reminder[]
  onChange: (r: Reminder[]) => void
  hasDeadline: boolean
  className: string
  /** A specific time picked but not added yet (datetime-local value). The form owns it, so Save can add it too. */
  draft: string
  onDraftChange: (at: string) => void
}

const ABSOLUTE = 'absolute'

export function RemindersEditor({ value, onChange, hasDeadline, className, draft, onDraftChange }: Props) {
  const [choice, setChoice] = useState('')

  function add(r: Reminder) {
    onChange([...value, r])
    setChoice('')
    onDraftChange('')
  }

  return (
    <div className="space-y-1.5">
      {value.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-md bg-subtle px-2 py-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Bell className="size-3.5 text-muted" aria-hidden /> {describeReminder(r)}
            {r.kind === 'relative' && !hasDeadline && <span className="text-xs text-accent"> (needs a deadline)</span>}
          </span>
          <button
            type="button"
            aria-label="Remove reminder"
            onClick={() => onChange(value.filter((x) => x.id !== r.id))}
            className="rounded p-0.5 text-muted hover:text-fg"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      {value.length < MAX_REMINDERS && (
        // The picker gets its own row under the menu: the menu, picker and Add don't fit side by side.
        <div className="space-y-1.5">
          <select
            aria-label="Add reminder"
            value={choice}
            onChange={(e) => {
              const v = e.target.value
              if (v && v !== ABSOLUTE) add({ id: crypto.randomUUID(), kind: 'relative', minutesBefore: Number(v) })
              else {
                setChoice(v)
                // A time that's no longer on screen isn't waiting to be added.
                if (v !== ABSOLUTE) onDraftChange('')
              }
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
            // Add wraps under the picker rather than squeezing it on the narrowest phones.
            <div className="flex flex-wrap gap-2">
              <input
                type="datetime-local"
                aria-label="Reminder time"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                className={cn(className, 'min-w-0 flex-[1_1_12rem]')}
              />
              <button
                type="button"
                disabled={!draft}
                onClick={() => add({ id: crypto.randomUUID(), kind: 'absolute', at: new Date(draft).getTime() })}
                className={btn.secondary}
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
      {/* The picker follows the browser's locale; this is the app's own reading of it. */}
      {choice === ABSOLUTE && draft && Number.isFinite(new Date(draft).getTime()) && (
        <p className="text-xs text-muted tabular-nums">Reminds you {formatDateTime(new Date(draft))}</p>
      )}
    </div>
  )
}
