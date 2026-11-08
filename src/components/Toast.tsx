import { useEffect, type ReactNode } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { X } from 'lucide-react'
import { exitTransition, SLIDE_FROM, SLIDE_TO, SPRING } from './motion/presets'
import { cn } from '../lib/utils'
import { hoverHighlight, panel, toastDismiss } from '../ui'

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
    <ToastPanel role="status" className={`flex items-center gap-3 py-3 pr-3 pl-4 text-sm ${panel.info}`}>
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.run()
            onDismiss(toast.id)
          }}
          className={`rounded-md px-2 py-1 font-semibold transition-colors ${panel.brand} ${hoverHighlight}`}
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className={toastDismiss}>
        <X className="size-4" />
      </button>
    </ToastPanel>
  )
}

/**
 * A colour panel that slides in from the screen edge and back out when removed. Render it as a
 * direct child of an `AnimatePresence` so the exit can play. Under reduced motion it appears and
 * disappears at once, without moving.
 */
export function ToastPanel({ role, className, children }: { role: 'status' | 'alert'; className?: string; children: ReactNode }) {
  const reduce = useReducedMotionConfig()
  const motionProps = reduce
    ? {}
    : { layout: true, initial: SLIDE_FROM, animate: SLIDE_TO, exit: { ...SLIDE_FROM, transition: exitTransition }, transition: SPRING.soft }
  return (
    <motion.div role={role} {...motionProps} className={cn('rounded-panel shadow-pop', className)}>
      {children}
    </motion.div>
  )
}
