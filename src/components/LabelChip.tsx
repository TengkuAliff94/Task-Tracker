import { X } from 'lucide-react'

interface Props {
  name: string
  color: string
  prefix?: string
  onRemove?: () => void
}

/**
 * A small colored pill for a project or tag. The text is the label color mixed toward the
 * foreground so light hues (yellow, cyan) stay readable on both themes.
 */
export function LabelChip({ name, color, prefix, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        color: `color-mix(in srgb, ${color} 72%, var(--fg))`,
        ['--tw-ring-color' as string]: `color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      <span className="opacity-60">{prefix}</span>
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="ml-0.5 rounded opacity-60 hover:opacity-100">
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
