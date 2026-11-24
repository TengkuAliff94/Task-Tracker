import { useId, useRef, type KeyboardEvent } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { formatDateText, readDateText, readTimeText } from '../lib/dateInput'
import { cn } from '../lib/utils'

/**
 * A date or time typed as text, so it reads DD/MM/YYYY and 24-hour in any locale, with the native
 * picker behind an icon button for when a calendar is quicker. The picker only ever writes into the
 * text field. Where the browser can't open a picker from a button (no `showPicker`), the button
 * isn't drawn and typing still works.
 */
interface Props {
  /** What's typed. The owner reads it with `readDateText` / `readTimeText`. */
  text: string
  onTextChange: (text: string) => void
  /** The text field's name, e.g. "Deadline date". */
  label: string
  /** Whose picker the button opens, e.g. "the deadline": "Open calendar for the deadline". */
  pickerFor: string
  className: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

const canShowPicker = typeof HTMLInputElement !== 'undefined' && 'showPicker' in HTMLInputElement.prototype

/** Sits on the field's Well Stone, so its hover steps one tone further, to the seam colour. */
const pickerButton =
  'absolute inset-y-0 right-1 my-auto inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-line hover:text-fg disabled:pointer-events-none disabled:opacity-50'

function TextWithPicker({
  kind,
  native,
  onPicked,
  onBlur,
  ...p
}: Props & { kind: 'date' | 'time'; native: string; onPicked: (value: string) => void; onBlur: () => void }) {
  const nativeRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const Icon = kind === 'date' ? CalendarDays : Clock
  const pickerName = `${kind === 'date' ? 'Open calendar' : 'Open time picker'} for ${p.pickerFor}`
  return (
    // group: pointing at the picker button still counts as pointing at the field, so its hover border stays.
    <div className="group relative">
      <input
        type="text"
        value={p.text}
        onChange={(e) => p.onTextChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={p.onKeyDown}
        disabled={p.disabled}
        placeholder={kind === 'date' ? 'DD/MM/YYYY' : 'HH:MM'}
        autoComplete="off"
        spellCheck={false}
        aria-label={p.label}
        aria-invalid={p.invalid ? true : undefined}
        // Until there's an error or a reading to point at, the format, since a placeholder isn't read out reliably.
        aria-describedby={p.describedBy ?? hintId}
        className={cn(p.className, 'tabular-nums', canShowPicker && 'pr-10', !p.invalid && 'group-hover:border-line-strong')}
      />
      <span id={hintId} className="sr-only">
        {kind === 'date' ? 'Day first, such as 25/04/2026. Words like “fri” also work.' : '24-hour clock, such as 17:30.'}
      </span>
      {canShowPicker && (
        <>
          {/* The picker opens from here: a 1px strip along the field's bottom edge, so it drops below the field. */}
          <input
            ref={nativeRef}
            type={kind}
            tabIndex={-1}
            aria-hidden
            value={native}
            onChange={(e) => e.target.value && onPicked(e.target.value)}
            disabled={p.disabled}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
          />
          <button
            type="button"
            aria-label={pickerName}
            title={pickerName}
            disabled={p.disabled}
            onClick={() => {
              try {
                nativeRef.current?.showPicker()
              } catch {
                // Refused (e.g. inside a cross-origin frame): typing still works, so say nothing.
              }
            }}
            className={pickerButton}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        </>
      )}
    </div>
  )
}

interface DateFieldProps extends Props {
  /**
   * "fri 5pm" names a time too. On leaving the field, the tidied date and that time come here
   * together, in one call, so an owner holding both in one value doesn't overwrite one with the other.
   * Required: tidying the text without moving the time across would drop it.
   */
  onTimeRead: (time: string, dateText: string) => void
}

/** A date typed day first. On leaving the field, anything it can read is written back as DD/MM/YYYY. */
export function DateField({ onTimeRead, ...p }: DateFieldProps) {
  const reading = readDateText(p.text)
  return (
    <TextWithPicker
      {...p}
      kind="date"
      native={reading?.ok ? reading.date : ''}
      onPicked={(iso) => p.onTextChange(formatDateText(iso))}
      onBlur={() => {
        if (!reading?.ok) return
        const tidy = formatDateText(reading.date)
        if (reading.time) onTimeRead(reading.time, tidy)
        else if (tidy !== p.text) p.onTextChange(tidy)
      }}
    />
  )
}

/** A time on the 24-hour clock. On leaving the field, anything it can read is written back as HH:MM. */
export function TimeField(p: Props) {
  const reading = readTimeText(p.text)
  return (
    <TextWithPicker
      {...p}
      kind="time"
      native={reading?.ok ? reading.time : ''}
      onPicked={(time) => p.onTextChange(time)}
      onBlur={() => {
        if (reading?.ok && reading.time !== p.text) p.onTextChange(reading.time)
      }}
    />
  )
}
