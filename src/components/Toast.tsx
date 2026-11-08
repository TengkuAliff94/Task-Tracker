import { useEffect } from 'react'
import { X } from 'lucide-react'

export interface ToastData {
  id: string
  message: string
  action?: { label: string; run: () => void }
}

const AUTO_DISMISS_MS = 6000

/** `onDismiss` should be stable (e.g. from useCallback) so re-renders don't restart the timer. */
export function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div role="status" className="flex items-center gap-3 rounded-lg bg-fg px-4 py-3 text-sm text-bg shadow-lg">
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.run()
            onDismiss(toast.id)
          }}
          className="font-semibold text-primary-hover underline-offset-2 hover:underline dark:text-primary"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  )
}
