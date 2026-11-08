import { useEffect, useRef, useState, type FormEvent } from 'react'
import { taskRepo } from '../db/tasks'
import { formatEffort, parseEffort } from '../lib/effort'
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  type Deadline,
  type Label,
  type Priority,
  type Status,
  type Task,
} from '../types'
import { ProjectPicker } from './ProjectPicker'
import { TagPicker } from './TagPicker'
import { RecurrenceEditor } from './RecurrenceEditor'
import { RemindersEditor } from './RemindersEditor'

interface Props {
  task?: Task // absent = create
  projects: Label[]
  tags: Label[]
  onClose: () => void
}

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800'

export function TaskForm({ task, projects, tags, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [date, setDate] = useState(task?.deadline?.date ?? '')
  const [time, setTime] = useState(task?.deadline?.time ?? '')
  const [projectId, setProjectId] = useState(task?.projectId)
  const [tagIds, setTagIds] = useState(task?.tagIds ?? [])
  const [effort, setEffort] = useState(task?.effortMinutes ? formatEffort(task.effortMinutes) : '')
  const [reminders, setReminders] = useState(task?.reminders ?? [])
  const [recurrence, setRecurrence] = useState(task?.recurrence)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const deadline: Deadline | undefined = date ? { date, time: time || undefined } : undefined
    const effortMinutes = parseEffort(effort)
    if (effort.trim() && effortMinutes === undefined) {
      setError('Effort should look like 30m, 2h or 1h30m')
      return
    }
    const fields = {
      title,
      description,
      status,
      priority,
      deadline,
      projectId,
      tagIds,
      effortMinutes,
      reminders,
      recurrence: deadline ? recurrence : undefined,
    }
    try {
      if (task) await taskRepo.update(task.id, fields)
      else await taskRepo.create(fields)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/40 dark:bg-slate-900 dark:text-slate-100"
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
          <label className="block space-y-1">
            <span className="text-sm font-medium">Project</span>
            <ProjectPicker projects={projects} value={projectId} onChange={setProjectId} className={field} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Effort</span>
            <input value={effort} onChange={(e) => setEffort(e.target.value)} placeholder="e.g. 30m, 2h" className={field} />
          </label>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium">Tags</span>
          <TagPicker tags={tags} value={tagIds} onChange={setTagIds} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-medium">Repeat</span>
            <RecurrenceEditor value={recurrence} onChange={setRecurrence} hasDeadline={Boolean(date)} className={field} />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Reminders</span>
            <RemindersEditor value={reminders} onChange={setReminders} hasDeadline={Boolean(date)} className={field} />
          </div>
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
