import { useRef } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { ArrowLeft, CheckCheck, DatabaseBackup, Keyboard, Plus, Tags, Trash2 } from 'lucide-react'
import { useHideOnScroll } from '../hooks/useHideOnScroll'
import { NotificationButton } from './NotificationButton'
import { ThemeToggle } from './ThemeToggle'
import { SPRING } from './motion/presets'
import { cn } from '../lib/utils'
import { btn, panel } from '../ui'

/** Which screen the app shows: the task list or the Trash. */
export type View = 'tasks' | 'trash'

interface Props {
  view: View
  trashCount: number
  onToggleTrash: () => void
  onBack: () => void
  onNewTask: () => void
  onLabels: () => void
  onBackup: () => void
  onShortcuts: () => void
}

/** The top bar. Slides away while you scroll down a long list and back when you scroll up. */
export function Header({ view, trashCount, onToggleTrash, onBack, onNewTask, onLabels, onBackup, onShortcuts }: Props) {
  const ref = useRef<HTMLElement>(null)
  const hidden = useHideOnScroll(ref)
  const reduce = useReducedMotionConfig()

  return (
    // The slide itself is CSS (`.hide-on-scroll`), so focus moving into the header shows it in the
    // same style pass, before the browser decides whether to scroll the focused button into view.
    // The bar is the solid canvas colour: a see-through blur smeared the saturated tiles passing under it.
    <header
      ref={ref}
      data-hidden={hidden}
      className="hide-on-scroll sticky top-0 z-40 -mx-4 mb-6 flex items-center justify-between gap-2 bg-bg px-4 py-4 sm:py-5"
    >
      {view === 'trash' ? (
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onBack} aria-label="Back to tasks" className={btn.headerIcon}>
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 id="page-heading" tabIndex={-1} className="truncate text-xl font-bold tracking-tight sm:text-2xl">Trash</h1>
            <p className="truncate text-xs text-muted">Restore or permanently delete</p>
          </div>
        </div>
      ) : (
        // The page heading lives in the heading panel below; the bar just carries the wordmark.
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${panel.brand}`}>
            <CheckCheck className="size-5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight max-sm:hidden">Task Tracker</span>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-panel bg-surface p-1 shadow-card max-sm:[&>button]:size-8">
          <NotificationButton />
          <button onClick={onLabels} aria-label="Projects & tags" title="Projects & tags" className={btn.headerIcon}>
            <Tags className="size-5" />
          </button>
          <button onClick={onBackup} aria-label="Backup & restore" title="Backup & restore" className={btn.headerIcon}>
            <DatabaseBackup className="size-5" />
          </button>
          <button
            onClick={onToggleTrash}
            aria-label={`Trash (${trashCount})`}
            title="Trash"
            aria-pressed={view === 'trash'}
            className={`${btn.headerIcon} relative aria-pressed:bg-panel-mustard aria-pressed:text-on-panel-mustard`}
          >
            <Trash2 className="size-5" />
            {trashCount > 0 && (
              // Keyed on the count, so each change remounts it and it pops in again.
              <motion.span
                key={trashCount}
                aria-hidden
                initial={reduce ? false : { scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={SPRING.pop}
                className={`absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-center text-xs leading-4.5 font-semibold tabular-nums ring-2 ring-surface ${panel.danger}`}
              >
                {trashCount}
              </motion.span>
            )}
          </button>
          <ThemeToggle />
          <button onClick={onShortcuts} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className={`${btn.headerIcon} max-sm:hidden`}>
            <Keyboard className="size-5" />
          </button>
        </div>
        {/* Not offered in Trash, where a new task wouldn't show. Hidden rather than removed, so the tray
            keeps its place and the Trash button stays under the pointer to switch back. */}
        <button
          onClick={onNewTask}
          aria-label="New task"
          className={cn(btn.brand, 'max-sm:size-10 max-sm:px-0', view === 'trash' && 'invisible')}
        >
          <Plus className="size-4" strokeWidth={2.5} /> <span className="hidden sm:inline">New task</span>
        </button>
      </div>
    </header>
  )
}
