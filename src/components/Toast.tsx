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
    <div role="status" className="flex animate-slide-in items-center gap-3 rounded-xl bg-fg py-3 pr-3 pl-4 text-sm text-bg shadow-modal ring-1 ring-white/10">
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.run()
            onDismiss(toast.id)
          }}
          className="rounded-md px-2 py-1 font-semibold text-teal-300 transition-colors hover:bg-white/10 dark:text-teal-700 dark:hover:bg-black/5"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  )
}
