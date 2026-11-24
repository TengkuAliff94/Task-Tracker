import { useRef } from 'react'
import { motion, useReducedMotionConfig } from 'motion/react'
import { ArrowLeft, CheckCheck, DatabaseBackup, Ellipsis, Keyboard, Monitor, Moon, Plus, Sun, Tags, Trash2 } from 'lucide-react'
import { useHideOnScroll } from '../hooks/useHideOnScroll'
import { useTheme } from '../hooks/useTheme'
import type { ThemePref } from '../lib/theme'
import { Menu, type MenuEntry } from './Menu'
import { NotificationButton } from './NotificationButton'
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

const THEME_OPTIONS = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const satisfies readonly { value: ThemePref; label: string; icon: unknown }[]

/** The top bar. Slides away while you scroll down a long list and back when you scroll up. */
export function Header({ view, trashCount, onToggleTrash, onBack, onNewTask, onLabels, onBackup, onShortcuts }: Props) {
  const ref = useRef<HTMLElement>(null)
  const hidden = useHideOnScroll(ref)
  const reduce = useReducedMotionConfig()
  const theme = useTheme()
  const themeLabel = THEME_OPTIONS.find((o) => o.value === theme.pref)!.label
  const themeEntry: MenuEntry = {
    kind: 'choice',
    label: 'Theme',
    value: theme.pref,
    options: THEME_OPTIONS,
    onChoose: (value) => theme.choose(value as ThemePref),
  }
  // The icon shows what's on screen; the name says what was chosen ("Theme: System").
  const ThemeIcon = theme.dark ? Moon : Sun

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
        {/* Labels appear as the width allows: Backup and Trash from md, Projects & tags from lg. Below sm,
            the tray keeps the bell and Trash and moves the rest into a labelled More menu, since phones
            have no hover tooltips to name a bare icon. Accessible names don't change with the width. */}
        <div className="flex items-center gap-0.5 rounded-panel bg-surface p-1 shadow-card">
          <NotificationButton />
          <button
            onClick={onLabels}
            aria-label="Projects & tags"
            title="Projects & tags"
            className={cn(btn.headerIcon, 'max-sm:hidden lg:w-auto lg:px-2.5')}
          >
            <Tags className="size-5" aria-hidden /> <span className="max-lg:hidden">Projects & tags</span>
          </button>
          <button
            onClick={onBackup}
            aria-label="Backup & restore"
            title="Backup & restore"
            className={cn(btn.headerIcon, 'max-sm:hidden md:w-auto md:px-2.5')}
          >
            <DatabaseBackup className="size-5" aria-hidden /> <span className="max-md:hidden">Backup</span>
          </button>
          <button
            onClick={onToggleTrash}
            aria-label={`Trash (${trashCount})`}
            title="Trash"
            aria-pressed={view === 'trash'}
            className={cn(
              btn.headerIcon,
              'relative max-sm:size-8 md:w-auto md:px-2.5 aria-pressed:bg-panel-mustard aria-pressed:text-on-panel-mustard',
            )}
          >
            <Trash2 className="size-5" aria-hidden /> <span className="max-md:hidden">Trash</span>
            {trashCount > 0 && (
              // Keyed on the count, so each change remounts it and it pops in again. A corner badge on the
              // bare icon; an inline count beside the word once the label shows.
              <motion.span
                key={trashCount}
                aria-hidden
                initial={reduce ? false : { scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={SPRING.pop}
                className={`absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-center text-xs leading-4.5 font-semibold tabular-nums ring-2 ring-surface md:static md:ring-0 ${panel.danger}`}
              >
                {trashCount}
              </motion.span>
            )}
          </button>
          <Menu label={`Theme: ${themeLabel}`} title="Theme" triggerClassName={cn(btn.headerIcon, 'max-sm:hidden')} entries={[themeEntry]}>
            <ThemeIcon className="size-5" aria-hidden />
          </Menu>
          <button onClick={onShortcuts} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className={`${btn.headerIcon} max-sm:hidden`}>
            <Keyboard className="size-5" aria-hidden />
          </button>
          <Menu
            label="More"
            triggerClassName={cn(btn.headerIcon, 'h-8 w-auto px-2.5 sm:hidden')}
            entries={[
              { kind: 'action', label: 'Projects & tags', icon: Tags, onSelect: onLabels },
              { kind: 'action', label: 'Backup & restore', icon: DatabaseBackup, onSelect: onBackup },
              themeEntry,
            ]}
          >
            <Ellipsis className="size-5" aria-hidden /> More
          </Menu>
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
