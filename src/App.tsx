import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { taskRepo } from './db/tasks'
import { projectRepo, tagRepo } from './db/labels'
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, type Filters } from './lib/filter'
import { groupTasks, sortTasks, type GroupKey, type SortKey } from './lib/sort'
import { useNow } from './hooks/useNow'
import { TaskRow } from './components/TaskRow'
import { TaskForm } from './components/TaskForm'
import { QuickAdd } from './components/QuickAdd'
import { FilterBar } from './components/FilterBar'
import { LabelManager } from './components/LabelManager'
import { ReminderAlerts } from './components/ReminderAlerts'
import { NotificationButton } from './components/NotificationButton'
import { useReminders } from './hooks/useReminders'
import type { Task } from './types'

type Editing = { mode: 'create' } | { mode: 'edit'; task: Task } | null

export default function App() {
  const tasks = useLiveQuery(() => taskRepo.list(), [])
  const projects = useLiveQuery(() => projectRepo.list(), []) ?? []
  const tags = useLiveQuery(() => tagRepo.list(), []) ?? []
  const now = useNow()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('smart')
  const [group, setGroup] = useState<GroupKey>('none')
  const [editing, setEditing] = useState<Editing>(null)
  const [managingLabels, setManagingLabels] = useState(false)
  const { alerts, dismiss, dismissAll } = useReminders(tasks)

  // Alerts hold a snapshot of the task, so open the latest version if it still exists.
  const openTask = (t: Task) => {
    const latest = tasks?.find((x) => x.id === t.id)
    if (latest) setEditing({ mode: 'edit', task: latest })
  }

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const visible = useMemo(
    () => (tasks ? sortTasks(applyFilters(tasks, filters, tagsById), sort, now) : []),
    [tasks, filters, tagsById, sort, now],
  )
  const groups = useMemo(() => groupTasks(visible, group, projects), [visible, group, projects])
  const doneCount = tasks?.filter((t) => t.status === 'done').length ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <div className="flex flex-wrap justify-end gap-2">
          <NotificationButton />
          <button
            onClick={() => setManagingLabels(true)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Projects & tags
          </button>
          <button
            onClick={() => setEditing({ mode: 'create' })}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New task
          </button>
        </div>
      </header>

      <ReminderAlerts alerts={alerts} onDismiss={dismiss} onDismissAll={dismissAll} onOpen={openTask} />

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

      <p className="mb-2 text-sm text-slate-500">
        {visible.length} task{visible.length === 1 ? '' : 's'}
      </p>

      {tasks === undefined ? null : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          {tasks.length === 0
            ? 'No tasks yet. Type one in the quick-add bar above.'
            : hasActiveFilters(filters)
              ? 'No tasks match these filters.'
              : 'Nothing left to do. 🎉'}
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.key}>
              {g.label && (
                <h2 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {g.color && <span className="size-2.5 rounded-full" style={{ backgroundColor: g.color }} />}
                  {g.label}
                  <span className="font-normal text-slate-400">{g.tasks.length}</span>
                </h2>
              )}
              <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {g.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    now={now}
                    projectsById={projectsById}
                    tagsById={tagsById}
                    onEdit={() => setEditing({ mode: 'edit', task })}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <TaskForm
          task={editing.mode === 'edit' ? editing.task : undefined}
          projects={projects}
          tags={tags}
          onClose={() => setEditing(null)}
        />
      )}
      {managingLabels && <LabelManager projects={projects} tags={tags} onClose={() => setManagingLabels(false)} />}
    </div>
  )
}
