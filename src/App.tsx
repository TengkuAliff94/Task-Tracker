import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence } from 'motion/react'
import { ClipboardList, PartyPopper, SearchX } from 'lucide-react'
import { taskRepo, TRASH_RETENTION_DAYS } from './db/tasks'
import { projectRepo, tagRepo } from './db/labels'
import { attachmentRepo } from './db/attachments'
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, matchesScope, withoutMissingLabels, type Filters, type Scope } from './lib/filter'
import { groupTasks, sortTasks, type GroupKey, type SortKey } from './lib/sort'
import { formatDeadline } from './lib/deadline'
import { describeSaveError } from './lib/utils'
import { useNow } from './hooks/useNow'
import { useKeepStorage } from './hooks/useKeepStorage'
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
import type { Deadline, Status, Task } from './types'
import { btn } from './ui'

/** "8 tasks", or with an Overview tile picked: "2 overdue tasks", "1 task due today", "2 completed tasks". */
function countLabel(n: number, scope: Scope | undefined): string {
  const tasks = n === 1 ? 'task' : 'tasks'
  if (scope === 'today') return `${n} ${tasks} due today`
  return scope ? `${n} ${SCOPE_ADJECTIVE[scope]} ${tasks}` : `${n} ${tasks}`
}
const SCOPE_ADJECTIVE: Record<Exclude<Scope, 'today'>, string> = { overdue: 'overdue', open: 'open', done: 'completed' }

/** What a picked Overview tile says when it has nothing to show. */
const EMPTY_SCOPE: Record<Scope, { title: string; body: string }> = {
  overdue: { title: 'Nothing overdue', body: 'Everything is on time.' },
  today: { title: 'Nothing due today', body: 'No task has a deadline today.' },
  open: { title: 'All clear', body: 'Nothing left to do.' },
  done: { title: 'Nothing completed yet', body: 'Tasks you finish will show here.' },
}

/**
 * The empty list: before any tasks, a way in (sample data); with only a tile picked, that tile's
 * own answer ("Nothing overdue") and a way back to everything; with other filters, "No matches".
 */
function ListEmpty({ tasks, filters, onShowAll }: { tasks: Task[]; filters: Filters; onShowAll: () => void }) {
  if (tasks.length === 0) {
    return (
      <EmptyState icon={ClipboardList} title="No tasks yet" action={<SampleDataButton variant="brand" />}>
        Type one in the quick-add bar above, or try the app with example tasks.
      </EmptyState>
    )
  }
  const { scope } = filters
  if (scope && !hasActiveFilters({ ...filters, scope: undefined })) {
    return (
      <EmptyState
        icon={scope === 'done' ? ClipboardList : PartyPopper}
        title={EMPTY_SCOPE[scope].title}
        action={
          <button type="button" onClick={onShowAll} className={btn.secondary}>
            Show all tasks
          </button>
        }
      >
        {EMPTY_SCOPE[scope].body}
      </EmptyState>
    )
  }
  if (hasActiveFilters(filters)) {
    return (
      <EmptyState icon={SearchX} title="No matches">
        No tasks match these filters.
      </EmptyState>
    )
  }
  return (
    <EmptyState icon={PartyPopper} title="All clear">
      Nothing left to do.
    </EmptyState>
  )
}

/** "Next due tomorrow 09:00". The relative label sits mid-sentence, so it starts lower case. */
function nextDueLabel(deadline: Deadline): string {
  const when = formatDeadline(deadline, new Date())
  return `Next due ${when.charAt(0).toLowerCase()}${when.slice(1)}`
}

/** Completion toasts share one slot: in a quick J/X run, only the latest stays on screen. */
const COMPLETION_SLOT = 'completion'

const TITLE_IN_TOAST = 60
/**
 * A task title short enough for a toast, so the words around it ("moved to Trash", "couldn’t be
 * marked as done") always show. Cuts whole characters (emoji and accents included), never halves,
 * and at a word break when there's one near the end.
 */
function toastTitle(title: string): string {
  const chars =
    typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(title), (s) => s.segment)
      : Array.from(title)
  if (chars.length <= TITLE_IN_TOAST) return title
  let cut = chars.slice(0, TITLE_IN_TOAST - 1)
  const space = cut.lastIndexOf(' ')
  if (space >= TITLE_IN_TOAST - 16) cut = cut.slice(0, space)
  return `${cut.join('').trimEnd()}…`
}

type Editing = { mode: 'create' } | { mode: 'edit'; task: Task } | null
type Modal = 'labels' | 'backup' | 'shortcuts' | null

const focusById = (id: string) => {
  const el = document.getElementById(id)
  el?.focus()
  el?.scrollIntoView({ block: 'nearest' })
}

export default function App() {
  const tasks = useLiveQuery(() => taskRepo.list(), [])
  const loadedProjects = useLiveQuery(() => projectRepo.list(), [])
  const loadedTags = useLiveQuery(() => tagRepo.list(), [])
  const projects = useMemo(() => loadedProjects ?? [], [loadedProjects])
  const tags = useMemo(() => loadedTags ?? [], [loadedTags])
  const attachmentCounts = useLiveQuery(() => attachmentRepo.countsByTask(), [])
  const trashCount = useLiveQuery(() => taskRepo.countTrash(), []) ?? 0
  const now = useNow()
  useKeepStorage()

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

  // The filter bar and tiles are hidden while the list is empty, so drop any filter left on then:
  // otherwise the next task added could be filtered out by a control nobody can see.
  const taskCount = tasks?.length
  useEffect(() => {
    if (taskCount === 0) setFilters((f) => (hasActiveFilters(f) ? { ...EMPTY_FILTERS, showCompleted: f.showCompleted } : f))
  }, [taskCount])

  // Deleting a project or tag that's picked as a filter takes the filter off too. Only once both
  // lists have loaded, so a filter isn't dropped for a label that just hasn't arrived yet.
  useEffect(() => {
    if (loadedProjects && loadedTags) setFilters((f) => withoutMissingLabels(f, loadedProjects, loadedTags))
  }, [loadedProjects, loadedTags])

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const visible = useMemo(
    () => (tasks ? sortTasks(applyFilters(tasks, filters, tagsById, now), sort, now) : []),
    [tasks, filters, tagsById, sort, now],
  )
  const groups = useMemo(() => groupTasks(visible, group, projects), [visible, group, projects])
  const ordered = useMemo(() => groups.flatMap((g) => g.tasks), [groups])
  const doneCount = tasks?.filter((t) => t.status === 'done').length ?? 0
  const selected = ordered.find((t) => t.id === selectedId)
  const hasTasks = Boolean(tasks?.length)
  const urgency = useMemo(
    () =>
      tasks?.length
        ? {
            overdue: tasks.filter((t) => matchesScope(t, 'overdue', now)).length,
            dueToday: tasks.filter((t) => matchesScope(t, 'today', now)).length,
            open: tasks.filter((t) => matchesScope(t, 'open', now)).length,
          }
        : undefined,
    [tasks, now],
  )
  const setScope = (scope: Scope | undefined) => setFilters((f) => ({ ...f, scope }))

  const showToast = useCallback(
    (t: Omit<ToastData, 'id'>) =>
      setToasts((prev) => [...prev.filter((p) => !t.slot || p.slot !== t.slot), { ...t, id: crypto.randomUUID() }]),
    [],
  )
  const closeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])
  /** Drops the toasts about a task, e.g. its "Done" toast once it's reopened some other way. */
  const closeToastsAbout = useCallback((taskId: string) => setToasts((prev) => prev.filter((t) => t.taskId !== taskId)), [])
  const showSaveError = useCallback(
    (what: string, err: unknown) => showToast({ message: what, detail: describeSaveError(err), urgent: true }),
    [showToast],
  )

  // A toast's action runs once, even if Undo is pressed again while the toast slides out, or Z as well.
  const spentToasts = useRef(new Set<string>())
  const runToastAction = useCallback(
    (t: ToastData) => {
      if (!t.action || spentToasts.current.has(t.id)) return
      spentToasts.current.add(t.id)
      closeToast(t.id)
      t.action.run()
    },
    [closeToast],
  )
  /** What Z undoes: the newest toast that offers an action. */
  const latestUndo = [...toasts].reverse().find((t) => t.action)

  // Alerts and selections can hold an old snapshot, so always open the latest version.
  const openTask = (t: Task) => {
    const latest = tasks?.find((x) => x.id === t.id)
    if (latest) setEditing({ mode: 'edit', task: latest })
  }

  async function trashTask(task: Task) {
    try {
      await taskRepo.trash(task.id)
    } catch (err) {
      showSaveError(`“${toastTitle(task.title)}” couldn’t be moved to Trash.`, err)
      return
    }
    setEditing(null)
    closeToastsAbout(task.id)
    showToast({
      message: `“${toastTitle(task.title)}” moved to Trash`,
      action: {
        label: 'Undo',
        run: () =>
          void taskRepo.restore(task.id).catch((err) => showSaveError(`“${toastTitle(task.title)}” couldn’t be restored.`, err)),
      },
    })
  }

  // Tasks whose tick is being saved. A second toggle meanwhile (a double click, X X) is ignored:
  // it would act on the task as it was before the first one landed.
  const savingDone = useRef(new Set<string>())

  /**
   * Ticks a task done or open, from its checkbox or X. Completing celebrates from `from` (nothing
   * under reduced motion), then a toast confirms it with Undo, which puts the task back as it was.
   * For a recurring task the toast also says when the copy it made is due, and Undo takes that
   * copy away again unless it's been started (the reopen rule in taskRepo.update).
   * Resolves to whether the change was saved.
   */
  async function setDone(task: Task, done: boolean, from?: Element | null): Promise<boolean> {
    if (savingDone.current.has(task.id)) return false
    savingDone.current.add(task.id)
    if (done) celebrate(from)
    else closeToastsAbout(task.id) // its "Done" toast would undo nothing now
    const title = toastTitle(task.title)
    try {
      const saved = await taskRepo.setStatus(task.id, done ? 'done' : 'todo')
      if (!done) return true
      const next = saved.nextInstanceId ? await taskRepo.get(saved.nextInstanceId) : undefined
      showToast({
        slot: COMPLETION_SLOT,
        taskId: task.id,
        message: `Done: ${title}`,
        detail: next?.deadline && nextDueLabel(next.deadline),
        action: {
          label: 'Undo',
          run: () => void taskRepo.setStatus(task.id, task.status).catch((err) => showSaveError(`“${title}” couldn’t be reopened.`, err)),
        },
      })
      return true
    } catch (err) {
      showSaveError(`“${title}” couldn’t be ${done ? 'marked as done' : 'reopened'}.`, err)
      return false
    } finally {
      savingDone.current.delete(task.id)
    }
  }

  /**
   * The X shortcut: the same as ticking the card's checkbox. If the card is about to leave the list,
   * the selection moves on now rather than once the save lands, so a quick J or X straight after
   * acts on the card that takes its place. It comes back if the save fails.
   */
  function toggleDone(task: Task) {
    if (savingDone.current.has(task.id)) return
    const done = task.status !== 'done'
    const stays = applyFilters([{ ...task, status: done ? 'done' : 'todo' }], filters, tagsById, now).length > 0
    let handedTo: string | null = null
    if (stays) toggledByX.current = { id: task.id, status: task.status }
    else {
      const i = ordered.findIndex((t) => t.id === task.id)
      handedTo = (ordered[i + 1] ?? ordered[i - 1])?.id ?? null
      setSelectedId(handedTo)
    }
    const from = document.querySelector(`[data-task-id="${task.id}"] input[type="checkbox"]`)
    void setDone(task, done, from).then((saved) => {
      if (!saved && !stays) setSelectedId((id) => (id === handedTo ? task.id : id))
    })
  }

  // When the selected card leaves its place (completed and hidden, filtered out, moved to Trash, or
  // moved by X), the selection passes to the card that now holds that place: the next one, else the
  // one before. So J and K carry on from where the person was instead of starting over at the top.
  // It's judged against the previous order, so a recurring task's new copy landing nearby doesn't count.
  const previousOrder = useRef<Task[]>([])
  const toggledByX = useRef<{ id: string; status: Status } | null>(null)
  useLayoutEffect(() => {
    const before = previousOrder.current
    previousOrder.current = ordered
    if (!selectedId) return
    const was = before.findIndex((t) => t.id === selectedId)
    if (was === -1) return
    const is = ordered.findIndex((t) => t.id === selectedId)
    // X on a card that stays in view (Show completed on) still hands over if the sort moves it.
    const toggled = toggledByX.current?.id === selectedId ? toggledByX.current : null
    const settled = toggled !== null && (is === -1 || ordered[is].status !== toggled.status)
    if (settled) toggledByX.current = null
    if (is !== -1 && !(settled && is !== was)) return
    const remaining = new Set(ordered.map((t) => t.id))
    remaining.delete(selectedId)
    const next =
      before.slice(was + 1).find((t) => remaining.has(t.id)) ?? before.slice(0, was).reverse().find((t) => remaining.has(t.id))
    setSelectedId(next?.id ?? null)
  }, [ordered, selectedId])

  function moveSelection(delta: number) {
    if (!ordered.length) return
    const i = ordered.findIndex((t) => t.id === selectedId)
    const next = i === -1 ? (delta > 0 ? 0 : ordered.length - 1) : Math.min(ordered.length - 1, Math.max(0, i + delta))
    const id = ordered[next].id
    setSelectedId(id)
    document.querySelector(`[data-task-id="${id}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  // X and Z ignore a held key's repeats: holding X would tick off card after card, and holding Z
  // would undo older toasts the person never meant to.
  const undoLatest = (e: KeyboardEvent) => !e.repeat && latestUndo && runToastAction(latestUndo)
  useShortcuts(
    view === 'tasks'
      ? {
          n: () => focusById('quick-add'),
          '/': () => focusById('search'),
          j: () => moveSelection(1),
          k: () => moveSelection(-1),
          e: () => selected && openTask(selected),
          x: (e) => !e.repeat && selected && toggleDone(selected),
          z: undoLatest,
          '?': () => setModal('shortcuts'),
          Escape: () => setSelectedId(null),
        }
      : { z: undoLatest, '?': () => setModal('shortcuts'), Escape: () => setView('tasks') },
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
        // Urgency first, then capture, then refine, then the list. Groups sit 24px apart; things
        // inside a group, 12px (the panel gutter).
        <div className="flex flex-col gap-6">
          {/* What needs attention: the heading says what's urgent and the Overview tiles filter to it.
              Side by side from `lg`; below that the tiles run under the heading. */}
          <div className="grid gap-3 lg:grid-cols-12">
            <Reveal index={0} className={hasTasks ? 'lg:col-span-5' : 'lg:col-span-12'}>
              <HeadingPanel dateLabel={todayLabel} urgency={urgency} />
            </Reveal>
            {tasks && hasTasks && (
              <div className="lg:col-span-7">
                <Overview tasks={tasks} now={now} scope={filters.scope} onScope={setScope} firstIndex={1} />
              </div>
            )}
          </div>

          {/* Notices come after the heading, so the page title is always the first thing read. */}
          <div className="flex flex-col gap-3 empty:hidden">
            <MissedRemindersBanner alerts={alerts} onDismissAll={dismissAll} onOpen={openTask} />
            <BackupNudge hasTasks={hasTasks} onOpen={() => setModal('backup')} />
          </div>

          <div className="flex flex-col gap-3">
            <Reveal index={hasTasks ? 1 + OVERVIEW_TILE_COUNT : 1}>
              <QuickAdd />
            </Reveal>
            {/* Nothing to filter yet on an empty list, so the empty state's way out stays in view. */}
            {hasTasks && (
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
            )}
          </div>

          <div>
            {hasTasks && (
              <div className="mb-3 flex items-center justify-between px-1 text-sm">
                {/* A status region, so a screen reader hears the new count after a filter changes. */}
                <p role="status" className="font-medium text-muted">{countLabel(visible.length, filters.scope)}</p>
                <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                  Press <kbd>?</kbd> for shortcuts
                </p>
              </div>
            )}

            {tasks === undefined ? null : visible.length === 0 ? (
              <ListEmpty tasks={tasks} filters={filters} onShowAll={() => setScope(undefined)} />
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
                          onToggleDone={(from) => void setDone(task, task.status !== 'done', from)}
                        />
                      ))}
                    </AnimatedList>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BurstLayer />
      <div className="fixed right-4 bottom-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {/* Lets a dismissed toast slide out; the rest of the stack then glides into its place. */}
        <AnimatePresence>
          {liveAlerts.map((a) => (
            <ReminderToast key={alertKey(a)} alert={a} onDismiss={() => dismiss(a)} onOpen={() => openTask(a.task)} />
          ))}
          {toasts.map((t) => (
            <Toast
              key={t.id}
              toast={t}
              onDismiss={closeToast}
              onAction={runToastAction}
              shortcut={t === latestUndo ? 'z' : undefined}
            />
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
