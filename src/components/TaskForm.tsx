import { useEffect, useRef, useState, type FormEvent } from 'react'
import { taskRepo } from '../db/tasks'
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  type Deadline,
  type Priority,
  type Status,
  type Task,
} from '../types'

interface Props {
  task?: Task // absent = create
  onClose: () => void
}

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800'

export function TaskForm({ task, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [date, setDate] = useState(task?.deadline?.date ?? '')
  const [time, setTime] = useState(task?.deadline?.time ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const deadline: Deadline | undefined = date ? { date, time: time || undefined } : undefined
    try {
      if (task) {
        await taskRepo.update(task.id, { title, description, status, priority, deadline })
      } else {
        await taskRepo.create({ title, description, status, priority, deadline })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-lg rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/40 dark:bg-slate-900 dark:text-slate-100"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">{task ? 'Edit task' : 'New task'}</h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Title</span>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Markdown supported"
            className={field}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={field}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={field}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Deadline</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Time (optional)</span>
            <input
              type="time"
              value={time}
              disabled={!date}
              onChange={(e) => setTime(e.target.value)}
              className={field}
            />
          </label>
        </div>

        {task && (
          <p className="text-xs text-slate-500">
            Added {new Date(task.createdAt).toLocaleString('en-GB')}
            {task.completedAt && ` · Completed ${new Date(task.completedAt).toLocaleString('en-GB')}`}
          </p>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            {task ? 'Save' : 'Add task'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
