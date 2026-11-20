import { useEffect, useState, type FocusEvent, type HTMLAttributes, type ReactNode } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { X } from 'lucide-react'
import { exitTransition, SLIDE_FROM, SLIDE_TO, SPRING } from './motion/presets'
import { cn } from '../lib/utils'
import { hoverHighlight, panel, toastDismiss } from '../ui'

export interface ToastData {
  id: string
  message: string
  /** A second line under the message, e.g. when a recurring task is next due. */
  detail?: string
  action?: { label: string; run: () => void }
  /** Toasts in the same slot replace each other, so a quick run of completions shows only the latest. */
  slot?: string
  /** The task the toast is about, so it can go once that task changes again. */
  taskId?: string
  /** Something failed: announced at once (`role="alert"`) instead of politely, and it stays until dismissed. */
  urgent?: boolean
}

const AUTO_DISMISS_MS = 6000

interface Props {
  toast: ToastData
  /** Should be stable (e.g. from useCallback) so re-renders don't restart the timer. */
  onDismiss: (id: string) => void
  /** Runs the toast's action. The caller removes the toast and makes sure the action runs once. */
  onAction?: (toast: ToastData) => void
  /** The key that also runs the action, for `aria-keyshortcuts`. */
  shortcut?: string
}

/**
 * A notice that closes itself after 6 seconds. The countdown waits while the pointer is over the
 * toast or focus is inside it, so its action can't vanish while someone is reaching for it. An
 * urgent toast (a failure) has no countdown: it stays until dismissed, so its advice can be read.
 */
export function Toast({ toast, onDismiss, onAction, shortcut }: Props) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const held = hovered || focused || Boolean(toast.urgent)

  useEffect(() => {
    if (held) return
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss, held])

  return (
    <ToastPanel
      role={toast.urgent ? 'alert' : 'status'}
      className={`flex items-center gap-3 py-3 pr-3 pl-4 text-sm ${panel.info}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
    >
      {/* Callers shorten task titles (toastTitle in App.tsx), so nothing here is clipped; a title
          can still be one unbroken string, so the text wraps anywhere. */}
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <p className="font-medium">{toast.message}</p>
        {toast.detail && <p className="mt-0.5">{toast.detail}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => onAction?.(toast)}
          aria-keyshortcuts={shortcut}
          className={`shrink-0 rounded-md px-2 py-1 font-semibold transition-colors ${panel.brand} ${hoverHighlight}`}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className={cn('shrink-0', toastDismiss)}>
        <X className="size-4" />
      </button>
    </ToastPanel>
  )
}

type PanelHandlers = Pick<HTMLAttributes<HTMLDivElement>, 'onPointerEnter' | 'onPointerLeave' | 'onFocus' | 'onBlur'>

/**
 * A colour panel that slides in from the screen edge and back out when removed. Render it as a
 * direct child of an `AnimatePresence` so the exit can play. Under reduced motion it appears and
 * disappears at once, without moving.
 */
export function ToastPanel({
  role,
  className,
  children,
  ...handlers
}: { role: 'status' | 'alert'; className?: string; children: ReactNode } & PanelHandlers) {
  const reduce = useReducedMotionConfig()
  const motionProps = reduce
    ? {}
    : { layout: true, initial: SLIDE_FROM, animate: SLIDE_TO, exit: { ...SLIDE_FROM, transition: exitTransition }, transition: SPRING.soft }
  return (
    <motion.div role={role} {...motionProps} {...handlers} className={cn('rounded-panel shadow-pop', className)}>
      {children}
    </motion.div>
  )
}
