import { useId, useState, type KeyboardEvent } from 'react'
import { Bell, X } from 'lucide-react'
import { formatDateTime } from '../lib/deadline'
import { instantOf, readDateText, readTimeText } from '../lib/dateInput'
import { describeReminder, MAX_REMINDERS, RELATIVE_PRESETS } from '../lib/reminders'
import type { Reminder } from '../types'
import { cn } from '../lib/utils'
import { btn, INVALID_FIELD } from '../ui'
import { DateField, TimeField } from './DateTimeFields'
import { FieldError } from './FieldError'

/** A specific reminder time as typed, before it's added: a day-first date and a 24-hour time. */
export interface ReminderDraft {
  date: string
  time: string
}

export const EMPTY_REMINDER_DRAFT: ReminderDraft = { date: '', time: '' }

interface Props {
  value: Reminder[]
  onChange: (r: Reminder[]) => void
  hasDeadline: boolean
  className: string
  /** A specific time typed but not added yet. The form owns it, so Save can add it too. */
  draft: ReminderDraft
  onDraftChange: (draft: ReminderDraft) => void
  /** Set by Save when the draft can't be added as it stands. */
  errors?: { date?: string; time?: string }
  errorIds: { date: string; time: string }
}

const ABSOLUTE = 'absolute'

/** The moment the draft names, once both halves can be read. A date typed with a time ("fri 9am") needs no time field. */
export function reminderDraftAt(draft: ReminderDraft): number | undefined {
  const day = readDateText(draft.date)
  if (!day?.ok) return undefined
  const time = readTimeText(draft.time)
  const hhmm = day.time ?? (time?.ok ? time.time : undefined)
  return hhmm ? instantOf(day.date, hhmm) : undefined
}

export function RemindersEditor({ value, onChange, hasDeadline, className, draft, onDraftChange, errors, errorIds }: Props) {
  const [choice, setChoice] = useState('')
  const at = reminderDraftAt(draft)
  const readoutId = useId()
  /** The reading, while there is one, so a screen reader hears how the typing was read. */
  const readout = choice === ABSOLUTE && at !== undefined ? readoutId : undefined

  function add(r: Reminder) {
    onChange([...value, r])
    setChoice('')
    onDraftChange(EMPTY_REMINDER_DRAFT)
  }

  function addDraft() {
    if (at !== undefined) add({ id: crypto.randomUUID(), kind: 'absolute', at })
  }

  /** Enter in either half adds the reminder once it's complete, like Add. Until then it falls through to Save, which says what's missing. */
  function handleEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing || at === undefined) return
    e.preventDefault()
    addDraft()
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
        // The fields get their own row under the menu: the menu, fields and Add don't fit side by side.
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
                if (v !== ABSOLUTE) onDraftChange(EMPTY_REMINDER_DRAFT)
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
            // Date and time share a row where both fit and stack where they don't, each with its error
            // under it. 9.25rem keeps the whole "DD/MM/YYYY" placeholder clear of the picker button.
            <div className="grid grid-cols-[repeat(auto-fit,minmax(9.25rem,1fr))] gap-2 [&>*]:min-w-0">
              <div className="space-y-1">
                <DateField
                  text={draft.date}
                  onTextChange={(date) => onDraftChange({ ...draft, date })}
                  onTimeRead={(time, date) => onDraftChange({ date, time })}
                  onKeyDown={handleEnter}
                  label="Reminder date"
                  pickerFor="the reminder"
                  invalid={Boolean(errors?.date)}
                  describedBy={errors?.date ? errorIds.date : readout}
                  className={cn(className, errors?.date && INVALID_FIELD)}
                />
                {errors?.date && <FieldError id={errorIds.date}>{errors.date}</FieldError>}
              </div>
              <div className="space-y-1">
                <TimeField
                  text={draft.time}
                  onTextChange={(time) => onDraftChange({ ...draft, time })}
                  onKeyDown={handleEnter}
                  label="Reminder time"
                  pickerFor="the reminder"
                  invalid={Boolean(errors?.time)}
                  describedBy={errors?.time ? errorIds.time : readout}
                  className={cn(className, errors?.time && INVALID_FIELD)}
                />
                {errors?.time && <FieldError id={errorIds.time}>{errors.time}</FieldError>}
              </div>
            </div>
          )}
          {choice === ABSOLUTE && (
            // The reading and Add share a line under the fields, so the fields keep the column's full width.
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              {/* Confirms the reading as it's typed, weekday included, before it's added. */}
              {at !== undefined && (
                <p id={readoutId} className="text-xs text-muted tabular-nums">
                  Reminds you {formatDateTime(new Date(at))}
                </p>
              )}
              <button type="button" disabled={at === undefined} onClick={addDraft} className={cn(btn.secondary, 'ml-auto')}>
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
