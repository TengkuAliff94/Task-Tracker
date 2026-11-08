import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, CheckCheck, ClipboardList, DatabaseBackup, Keyboard, PartyPopper, Plus, SearchX, Tags, Trash2 } from 'lucide-react'
import { taskRepo, TRASH_RETENTION_DAYS } from './db/tasks'
import { projectRepo, tagRepo } from './db/labels'
import { attachmentRepo } from './db/attachments'
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, type Filters } from './lib/filter'
import { groupTasks, sortTasks, type GroupKey, type SortKey } from './lib/sort'
import { useNow } from './hooks/useNow'
import { useReminders } from './hooks/useReminders'
import { useShortcuts } from './hooks/useShortcuts'
import { TaskRow } from './components/TaskRow'
import { TaskForm } from './components/TaskForm'
import { QuickAdd } from './components/QuickAdd'
import { FilterBar } from './components/FilterBar'
import { LabelManager } from './components/LabelManager'
import { alertKey, MissedRemindersBanner, ReminderToast } from './components/ReminderAlerts'
import { NotificationButton } from './components/NotificationButton'
import { TrashView } from './components/TrashView'
import { BackupDialog, BackupNudge } from './components/Backup'
import { ThemeToggle } from './components/ThemeToggle'
import { SampleDataButton } from './components/SampleDataButton'
import { Overview } from './components/Overview'
import { EmptyState } from './components/EmptyState'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { Toast, type ToastData } from './components/Toast'
import type { Task } from './types'
import { btn, card } from './ui'

type Editing = { mode: 'create' } | { mode: 'edit'; task: Task } | null
type Modal = 'labels' | 'backup' | 'shortcuts' | null

const focusById = (id: string) => {
  const el = document.getElementById(id)
  el?.focus()
  el?.scrollIntoView({ block: 'nearest' })
}

export default function App() {
  const tasks = useLiveQuery(() => taskRepo.list(), [])
  const projects = useLiveQuery(() => projectRepo.list(), []) ?? []
  const tags = useLiveQuery(() => tagRepo.list(), []) ?? []
  const attachmentCounts = useLiveQuery(() => attachmentRepo.countsByTask(), [])
  const trashCount = useLiveQuery(() => taskRepo.countTrash(), []) ?? 0
  const now = useNow()

  const [view, setView] = useState<'tasks' | 'trash'>('tasks')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('smart')
  const [group, setGroup] = useState<GroupKey>('none')
  const [editing, setEditing] = useState<Editing>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const { alerts, dismiss, dismissAll } = useReminders(tasks)

  // Clear out Trash items past the retention period once per launch.
  useEffect(() => {
    taskRepo.emptyTrash(TRASH_RETENTION_DAYS)
  }, [])

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const visible = useMemo(
    () => (tasks ? sortTasks(applyFilters(tasks, filters, tagsById), sort, now) : []),
    [tasks, filters, tagsById, sort, now],
  )
  const groups = useMemo(() => groupTasks(visible, group, projects), [visible, group, projects])
  const ordered = useMemo(() => groups.flatMap((g) => g.tasks), [groups])
  const doneCount = tasks?.filter((t) => t.status === 'done').length ?? 0
  const oldestTaskAt = tasks?.length ? Math.min(...tasks.map((t) => t.createdAt)) : undefined
  const selected = ordered.find((t) => t.id === selectedId)

  const showToast = useCallback((t: Omit<ToastData, 'id'>) => setToasts((prev) => [...prev, { ...t, id: crypto.randomUUID() }]), [])
  const closeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  // Alerts and selections can hold an old snapshot, so always open the latest version.
  const openTask = (t: Task) => {
    const latest = tasks?.find((x) => x.id === t.id)
    if (latest) setEditing({ mode: 'edit', task: latest })
  }

  async function trashTask(task: Task) {
    await taskRepo.trash(task.id)
    setEditing(null)
    showToast({ message: `“${task.title}” moved to Trash`, action: { label: 'Undo', run: () => taskRepo.restore(task.id) } })
  }

  function moveSelection(delta: number) {
    if (!ordered.length) return
    const i = ordered.findIndex((t) => t.id === selectedId)
    const next = i === -1 ? (delta > 0 ? 0 : ordered.length - 1) : Math.min(ordered.length - 1, Math.max(0, i + delta))
    const id = ordered[next].id
    setSelectedId(id)
    document.querySelector(`[data-task-id="${id}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  useShortcuts(
    view === 'tasks'
      ? {
          n: () => focusById('quick-add'),
          '/': () => focusById('search'),
          j: () => moveSelection(1),
          k: () => moveSelection(-1),
          e: () => selected && openTask(selected),
          x: () => selected && taskRepo.setStatus(selected.id, selected.status === 'done' ? 'todo' : 'done'),
          '?': () => setModal('shortcuts'),
          Escape: () => setSelectedId(null),
        }
      : { '?': () => setModal('shortcuts'), Escape: () => setView('tasks') },
  )

  const liveAlerts = alerts.filter((a) => !a.missed)
  const todayLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <header className="sticky top-0 z-40 -mx-4 mb-6 flex items-center justify-between gap-2 border-b border-transparent bg-bg/75 px-4 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60 sm:py-5">
        {view === 'trash' ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setView('tasks')} aria-label="Back to tasks" className={btn.icon}>
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Trash</h1>
              <p className="text-xs text-muted">Restore or permanently delete</p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl max-sm:hidden bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-primary">
              <CheckCheck className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">Tasks</h1>
              <p className="truncate text-xs text-muted">{todayLabel}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-surface/80 p-0.5 shadow-xs max-sm:[&>*]:size-8">
          <NotificationButton />
          <button onClick={() => setModal('labels')} aria-label="Projects & tags" title="Projects & tags" className={btn.icon}>
            <Tags className="size-5" />
          </button>
          <button onClick={() => setModal('backup')} aria-label="Backup & restore" title="Backup & restore" className={btn.icon}>
            <DatabaseBackup className="size-5" />
          </button>
          <button
            onClick={() => setView(view === 'trash' ? 'tasks' : 'trash')}
            aria-label={`Trash (${trashCount})`}
            title="Trash"
            aria-pressed={view === 'trash'}
            className={`${btn.icon} relative ${view === 'trash' ? 'bg-subtle text-fg' : ''}`}
          >
            <Trash2 className="size-5" />
            {trashCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-surface dark:text-black">
                {trashCount}
              </span>
            )}
          </button>
          <ThemeToggle />
          <button onClick={() => setModal('shortcuts')} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className={`${btn.icon} max-sm:hidden`}>
            <Keyboard className="size-5" />
          </button>
          </div>
          <button onClick={() => setEditing({ mode: 'create' })} aria-label="New task" className={`${btn.primary} max-sm:size-9 max-sm:px-0`}>
            <Plus className="size-4" strokeWidth={2.5} /> <span className="hidden sm:inline">New task</span>
          </button>
        </div>
      </header>

      {view === 'trash' ? (
        <TrashView />
      ) : (
        <>
          <MissedRemindersBanner alerts={alerts} onDismissAll={dismissAll} onOpen={openTask} />
          <BackupNudge oldestTaskAt={oldestTaskAt} onOpen={() => setModal('backup')} />
          {tasks && tasks.length > 0 && <Overview tasks={tasks} now={now} />}
          <QuickAdd />
          <FilterBar
            filters={filters}
            onFilters={setFilters}
            sort={sort}
            onSort={setSort}
            group={group}
            onGroup={setGroup}
            projects={projects}
            tags={tags}
            doneCount={doneCount}
          />

          <div className="mb-2.5 flex items-center justify-between px-1 text-sm">
            <p className="font-medium text-muted">
              {visible.length} task{visible.length === 1 ? '' : 's'}
            </p>
            <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              Press <kbd>?</kbd> for shortcuts
            </p>
          </div>

          {tasks === undefined ? null : visible.length === 0 ? (
            <EmptyState
              icon={tasks.length === 0 ? ClipboardList : hasActiveFilters(filters) ? SearchX : PartyPopper}
              title={tasks.length === 0 ? 'No tasks yet' : hasActiveFilters(filters) ? 'No matches' : 'All clear'}
            >
              {tasks.length === 0 ? (
                <>
                  Type one in the quick-add bar above, or try the app with example tasks.
                  <span className="mt-5 block">
                    <SampleDataButton />
                  </span>
                </>
              ) : hasActiveFilters(filters)
                  ? 'No tasks match these filters.'
                  : 'Nothing left to do.'}
            </EmptyState>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <section key={g.key}>
                  {g.label && (
                    <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">
                      {g.color && <span className="size-2 rounded-full" style={{ backgroundColor: g.color }} />}
                      {g.label}
                      <span className="rounded-full bg-subtle px-1.5 py-px text-[11px] font-medium tracking-normal tabular-nums">
                        {g.tasks.length}
                      </span>
                    </h2>
                  )}
                  <ul
                    aria-label={g.label ? `${g.label} tasks` : 'Tasks'}
                    className={`${card} divide-y divide-line overflow-hidden`}
                  >
                    {g.tasks.map((task, i) => (
                      <TaskRow
                        key={task.id}
                        index={i}
                        task={task}
                        now={now}
                        projectsById={projectsById}
                        tagsById={tagsById}
                        attachmentCount={attachmentCounts?.get(task.id) ?? 0}
                        selected={task.id === selectedId}
                        onEdit={() => {
                          setSelectedId(task.id)
                          setEditing({ mode: 'edit', task })
                        }}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <div className="fixed right-4 bottom-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {liveAlerts.map((a) => (
          <ReminderToast key={alertKey(a)} alert={a} onDismiss={() => dismiss(a)} onOpen={() => openTask(a.task)} />
        ))}
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={closeToast} />
        ))}
      </div>

      {editing && (
        <TaskForm
          task={editing.mode === 'edit' ? editing.task : undefined}
          projects={projects}
          tags={tags}
          onClose={() => setEditing(null)}
          onTrash={trashTask}
        />
      )}
      {modal === 'labels' && <LabelManager projects={projects} tags={tags} onClose={() => setModal(null)} />}
      {modal === 'backup' && <BackupDialog onClose={() => setModal(null)} />}
      {modal === 'shortcuts' && <ShortcutsHelp onClose={() => setModal(null)} />}
    </div>
  )
}
