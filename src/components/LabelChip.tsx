import { X } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { labelTint } from '../lib/colors'

interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  name: string
  color: string
  prefix?: string
  onRemove?: () => void
  /** "phone": below `sm` the chip is just its dot and name, with no tint or ring (tags on a task card). */
  quiet?: 'phone'
}

/**
 * A small pill for a project or tag. The label's own colour shows as a dot, a tint and an
 * outline; the text stays in the body colour, so any hue the user picks remains readable
 * (colour-tinted text dropped to 2:1 for light hues).
 */
export function LabelChip({ name, color, prefix, onRemove, quiet, ...rest }: Props) {
  return (
    <span
      {...rest}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-fg ring-1 ring-inset ${
        // Important, to beat the inline tint.
        quiet === 'phone' ? 'max-sm:bg-transparent! max-sm:px-0 max-sm:ring-0' : ''
      }`}
      style={labelTint(color)}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {/* The sigil sits against the name ("#finance", "@Home"), as typed in quick add and shown in the filter pills. */}
      <span>
        {prefix && <span className="text-muted">{prefix}</span>}
        {name}
      </span>
      {onRemove && (
        // 24px to tap (WCAG 2.5.8), drawn the same size as before: the padding is cancelled by negative margins.
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="-my-1.5 -mr-1.5 -ml-1 rounded p-1.5 opacity-60 hover:opacity-100">
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
