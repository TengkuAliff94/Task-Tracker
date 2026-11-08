import { X } from 'lucide-react'

interface Props {
  name: string
  color: string
  prefix?: string
  onRemove?: () => void
}

/**
 * A small pill for a project or tag. The label's own colour shows as a dot, a tint and an
 * outline; the text stays in the body colour, so any hue the user picks remains readable
 * (colour-tinted text dropped to 2:1 for light hues).
 */
export function LabelChip({ name, color, prefix, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-fg ring-1 ring-inset"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        ['--tw-ring-color' as string]: `color-mix(in srgb, ${color} 45%, transparent)`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="text-muted">{prefix}</span>
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="ml-0.5 rounded opacity-60 hover:opacity-100">
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
