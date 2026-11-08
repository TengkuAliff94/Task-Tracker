import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { taskRepo } from './db/tasks'
import { defaultSort } from './lib/sort'
import { useNow } from './hooks/useNow'
import { TaskRow } from './components/TaskRow'
import { TaskForm } from './components/TaskForm'
import type { Task } from './types'

type Editing = { mode: 'create' } | { mode: 'edit'; task: Task } | null

export default function App() {
  const tasks = useLiveQuery(() => taskRepo.list(), [])
  const now = useNow()
  const [showCompleted, setShowCompleted] = useState(false)
  const [editing, setEditing] = useState<Editing>(null)

  const visible = useMemo(() => {
    if (!tasks) return []
    const filtered = showCompleted ? tasks : tasks.filter((t) => t.status !== 'done')
    return defaultSort(filtered, now)
  }, [tasks, showCompleted, now])

  const doneCount = tasks?.filter((t) => t.status === 'done').length ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button
          onClick={() => setEditing({ mode: 'create' })}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          New task
        </button>
      </header>

      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>{visible.length} shown</span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show completed ({doneCount})
        </label>
      </div>

      {tasks === undefined ? null : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
          No tasks yet. Click <strong>New task</strong> to add one.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              now={now}
              onEdit={() => setEditing({ mode: 'edit', task })}
            />
          ))}
        </ul>
      )}

      {editing && (
        <TaskForm
          task={editing.mode === 'edit' ? editing.task : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
