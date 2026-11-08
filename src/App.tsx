import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence } from 'motion/react'
import { ClipboardList, PartyPopper, SearchX } from 'lucide-react'
import { taskRepo, TRASH_RETENTION_DAYS } from './db/tasks'
import { projectRepo, tagRepo } from './db/labels'
import { attachmentRepo } from './db/attachments'
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, type Filters } from './lib/filter'
import { groupTasks, sortTasks, type GroupKey, type SortKey } from './lib/sort'
import { useNow } from './hooks/useNow'
import { useReminders } from './hooks/useReminders'
import { useShortcuts } from './hooks/useShortcuts'
import { TaskCard } from './components/TaskCard'
import { GroupHeading } from './components/GroupHeading'
import { AnimatedList } from './components/motion/AnimatedList'
import { BurstLayer, celebrate } from './components/motion/Burst'
import { TaskForm } from './components/TaskForm'
import { QuickAdd } from './components/QuickAdd'
import { FilterBar } from './components/FilterBar'
import { LabelManager } from './components/LabelManager'
import { alertKey, MissedRemindersBanner, ReminderToast } from './components/ReminderAlerts'
import { Header, type View } from './components/Header'
import { TrashView } from './components/TrashView'
import { BackupDialog, BackupNudge } from './components/Backup'
import { SampleDataButton } from './components/SampleDataButton'
import { Overview, OVERVIEW_TILE_COUNT } from './components/Overview'
import { HeadingPanel } from './components/HeadingPanel'
import { Reveal } from './components/motion/Reveal'
import { EmptyState } from './components/EmptyState'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { Toast, type ToastData } from './components/Toast'
import type { Task } from './types'

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

  const [view, setView] = useState<View>('tasks')
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

  /** The X shortcut: same as ticking the card's checkbox, celebration included. */
  function toggleDone(task: Task) {
    if (task.status !== 'done') celebrate(document.querySelector(`[data-task-id="${task.id}"] input[type="checkbox"]`))
    taskRepo.setStatus(task.id, task.status === 'done' ? 'todo' : 'done')
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
          x: () => selected && toggleDone(selected),
          '?': () => setModal('shortcuts'),
          Escape: () => setSelectedId(null),
        }
      : { '?': () => setModal('shortcuts'), Escape: () => setView('tasks') },
  )

  const liveAlerts = alerts.filter((a) => !a.missed)
  const todayLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <Header
        view={view}
        trashCount={trashCount}
        onToggleTrash={() => setView(view === 'trash' ? 'tasks' : 'trash')}
        onBack={() => setView('tasks')}
        onNewTask={() => setEditing({ mode: 'create' })}
        onLabels={() => setModal('labels')}
        onBackup={() => setModal('backup')}
        onShortcuts={() => setModal('shortcuts')}
      />

      {view === 'trash' ? (
        <TrashView />
      ) : (
        <>
          <MissedRemindersBanner alerts={alerts} onDismissAll={dismissAll} onOpen={openTask} />
          <BackupNudge oldestTaskAt={oldestTaskAt} onOpen={() => setModal('backup')} />
          {/* The bento: heading and Overview share a row on wide screens, quick add spans below. */}
          <div className="mb-3 grid gap-3 md:grid-cols-12">
            <Reveal index={0} className={tasks?.length ? 'md:col-span-5' : 'md:col-span-12'}>
              <HeadingPanel dateLabel={todayLabel} />
            </Reveal>
            {tasks && tasks.length > 0 && (
              <div className="md:col-span-7">
                <Overview tasks={tasks} now={now} firstIndex={1} />
              </div>
            )}
            <Reveal index={tasks?.length ? 1 + OVERVIEW_TILE_COUNT : 1} className="md:col-span-12">
              <QuickAdd />
            </Reveal>
          </div>
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
              action={tasks.length === 0 && <SampleDataButton prominent />}
            >
              {tasks.length === 0
                ? 'Type one in the quick-add bar above, or try the app with example tasks.'
                : hasActiveFilters(filters)
                  ? 'No tasks match these filters.'
                  : 'Nothing left to do.'}
            </EmptyState>
          ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.key}>
                  {g.label && <GroupHeading by={group} group={g} />}
                  {/* Cards fill rows left to right, the same order J/K walk them in. */}
                  <AnimatedList aria-label={g.label ? `${g.label} tasks` : 'Tasks'} className="grid gap-3 md:grid-cols-2">
                    {g.tasks.map((task, i) => (
                      <TaskCard
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
                  </AnimatedList>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <BurstLayer />
      <div className="fixed right-4 bottom-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {/* Lets a dismissed toast slide out; the rest of the stack then glides into its place. */}
        <AnimatePresence>
          {liveAlerts.map((a) => (
            <ReminderToast key={alertKey(a)} alert={a} onDismiss={() => dismiss(a)} onOpen={() => openTask(a.task)} />
          ))}
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={closeToast} />
          ))}
        </AnimatePresence>
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
