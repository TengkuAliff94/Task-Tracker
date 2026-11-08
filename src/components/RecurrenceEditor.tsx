import { RECURRENCE_PRESETS } from '../lib/recurrence'
import type { Recurrence } from '../types'

interface Props {
  value?: Recurrence
  onChange: (r: Recurrence | undefined) => void
  hasDeadline: boolean
  className: string
}

const key = (r: Recurrence) => `${r.unit}-${r.interval}`
const PRESET_KEYS = new Set(RECURRENCE_PRESETS.map((p) => key(p.value)))

/** "Repeat" picker: none, a preset, or every N days/weeks. Needs a deadline to step from. */
export function RecurrenceEditor({ value, onChange, hasDeadline, className }: Props) {
  const isCustom = value !== undefined && !PRESET_KEYS.has(key(value))
  const selected = !value ? '' : isCustom ? 'custom' : key(value)

  return (
    <div className="space-y-1.5">
      <select
        aria-label="Repeat"
        disabled={!hasDeadline}
        value={selected}
        onChange={(e) => {
          const v = e.target.value
          if (!v) onChange(undefined)
          else if (v === 'custom') onChange({ unit: 'day', interval: 2 })
          else onChange(RECURRENCE_PRESETS.find((p) => key(p.value) === v)!.value)
        }}
        className={className}
      >
        <option value="">Doesn't repeat</option>
        {RECURRENCE_PRESETS.map((p) => (
          <option key={p.label} value={key(p.value)}>{p.label}</option>
        ))}
        <option value="custom">Every N days or weeks…</option>
      </select>
      {!hasDeadline && <p className="text-xs text-muted">Set a deadline to make this repeat.</p>}
      {isCustom && value && (
        <div className="flex items-center gap-2 text-sm">
          Every
          <input
            type="number"
            min={1}
            max={365}
            aria-label="Repeat interval"
            value={value.interval}
            onChange={(e) => onChange({ ...value, interval: Math.max(1, Number(e.target.value) || 1) })}
            className={`${className} w-20`}
          />
          <select
            aria-label="Repeat unit"
            value={value.unit}
            onChange={(e) => onChange({ ...value, unit: e.target.value as 'day' | 'week' })}
            className={`${className} w-28`}
          >
            <option value="day">days</option>
            <option value="week">weeks</option>
          </select>
        </div>
      )}
    </div>
  )
}
