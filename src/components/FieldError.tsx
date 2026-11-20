import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

/**
 * What's wrong with one field, right under it, in place of the browser's validation bubble.
 * Point the field at it with `aria-describedby={id}` and `aria-invalid`, and style it `INVALID_FIELD`.
 */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger">
      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  )
}
