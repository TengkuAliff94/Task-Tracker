import { X } from 'lucide-react'

interface Props {
  name: string
  color: string
  prefix?: string
  onRemove?: () => void
}

/** A small colored pill for a project or tag. */
export function LabelChip({ name, color, prefix, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {prefix}
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="ml-0.5 opacity-70 hover:opacity-100">
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
