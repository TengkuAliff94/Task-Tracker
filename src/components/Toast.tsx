import { useEffect, useState, type FocusEvent, type HTMLAttributes, type ReactNode } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { X } from 'lucide-react'
import { exitTransition, SLIDE_FROM, SLIDE_TO, SPRING } from './motion/presets'
import { cn } from '../lib/utils'
import { attentionAction, INVERTED_PANEL, panel, toastDismiss } from '../ui'

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
  /** Not a failure, but it stays until dismissed: its action is still good long after 6 seconds (Undo restore). */
  sticky?: boolean
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
  /** Holds the countdown, e.g. while a modal dialog makes the toast unreachable. */
  paused?: boolean
}

/**
 * A notice that closes itself after 6 seconds. The countdown waits while the pointer is over the
 * toast, while focus is inside it, and while it's `paused` (a dialog is open over it), so its action
 * can't vanish while someone is reaching for it; it starts again from 6 seconds after each wait. An
 * urgent toast (a failure) has no countdown: it stays until dismissed, so its advice can be read.
 * Neither has a sticky one, whose action stays good for the whole session.
 *
 * Only an urgent toast announces itself (`role="alert"`). The others are read out through the app's
 * always-present live region (`ToastAnnouncer`), which screen readers pick up more reliably than a
 * region that arrives with its text already in it, so their own status role is kept silent.
 */
export function Toast({ toast, onDismiss, onAction, shortcut, paused = false }: Props) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const held = hovered || focused || paused || Boolean(toast.urgent || toast.sticky)

  useEffect(() => {
    if (held) return
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss, held])

  return (
    <ToastPanel
      role={toast.urgent ? 'alert' : 'status'}
      toastId={toast.id}
      className={`flex items-center gap-3 py-3 pr-3 pl-4 text-sm ${panel.ink}`}
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
        {/* Pretty wrapping, so a short last word ("Trash") never sits alone on its line. */}
        <p className="font-medium text-pretty">{toast.message}</p>
        {toast.detail && <p className="mt-0.5">{toast.detail}</p>}
      </div>
      {/* The panel's colours swapped, like Back up now on the backup reminder: one main action per panel, no second brand button. */}
      {toast.action && (
        <button
          type="button"
          onClick={() => onAction?.(toast)}
          aria-keyshortcuts={shortcut}
          className={cn('shrink-0', attentionAction, INVERTED_PANEL.ink)}
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

/** What a toast says to a screen reader: its message and detail, and how to undo where it can. */
export function toastAnnouncement(toast: ToastData, shortcut?: string): string {
  const parts = [toast.message, toast.detail].filter(Boolean)
  if (toast.action && shortcut) parts.push(`Press ${shortcut.toUpperCase()} to ${toast.action.label.toLowerCase()}.`)
  return parts.join('. ').replace(/\.\. /g, '. ')
}

/**
 * A live region that's on the page from the start, so screen readers announce each new toast. Each
 * announcement is a new child (keyed by the toast), so the same words twice are still read twice.
 * Visually hidden: the toast itself is what sighted people see.
 */
export function ToastAnnouncer({ announcement }: { announcement: { id: string; text: string } | null }) {
  return (
    <div aria-live="polite" className="sr-only">
      {announcement && <p key={announcement.id}>{announcement.text}</p>}
    </div>
  )
}

/**
 * A colour panel that slides in from the screen edge and back out when removed. Render it as a
 * direct child of an `AnimatePresence` so the exit can play. Under reduced motion it appears and
 * disappears at once, without moving.
 */
export function ToastPanel({
  role,
  toastId,
  className,
  children,
  ...handlers
}: { role: 'status' | 'alert'; toastId: string; className?: string; children: ReactNode } & PanelHandlers) {
  const reduce = useReducedMotionConfig()
  const motionProps = reduce
    ? {}
    : { layout: true, initial: SLIDE_FROM, animate: SLIDE_TO, exit: { ...SLIDE_FROM, transition: exitTransition }, transition: SPRING.soft }
  return (
    // A status toast stays silent itself (`aria-live="off"`): ToastAnnouncer reads it out.
    <motion.div
      role={role}
      aria-live={role === 'status' ? 'off' : undefined}
      data-toast-id={toastId}
      {...motionProps}
      {...handlers}
      className={cn('rounded-panel shadow-pop', className)}
    >
      {children}
    </motion.div>
  )
}
