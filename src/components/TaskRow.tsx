import { taskRepo } from '../db/tasks'
import { formatDeadline, isOverdue } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { describeRecurrence } from '../lib/recurrence'
import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Priority, type Task } from '../types'
import { LabelChip } from './LabelChip'

const PRIORITY_STYLE: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

interface Props {
  task: Task
  now: Date
  projectsById: Map<string, Label>
  tagsById: Map<string, Label>
  onEdit: () => void
}

export function TaskRow({ task, now, projectsById, tagsById, onEdit }: Props) {
  const overdue = isOverdue(task, now)
  const project = task.projectId ? projectsById.get(task.projectId) : undefined
  const done = task.status === 'done'

  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <input
        type="checkbox"
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        checked={done}
        onChange={() => taskRepo.setStatus(task.id, done ? 'todo' : 'done')}
        className="mt-1 size-4 cursor-pointer"
      />
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className={`truncate font-medium ${done ? 'text-slate-400 line-through' : ''}`}>
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded px-1.5 py-0.5 ${PRIORITY_STYLE[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.status === 'in_progress' && (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {STATUS_LABEL.in_progress}
            </span>
          )}
          {overdue && (
            <span className="rounded bg-rose-600 px-1.5 py-0.5 font-medium text-white">Overdue</span>
          )}
          {task.deadline && (
            <span className={overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
              {formatDeadline(task.deadline, now)}
            </span>
          )}
          {task.recurrence && (
            <span className="text-slate-500" title="Repeats">🔁 {describeRecurrence(task.recurrence)}</span>
          )}
          {task.reminders.length > 0 && (
            <span className="text-slate-500" title={`${task.reminders.length} reminder(s)`}>🔔{task.reminders.length}</span>
          )}
          {task.effortMinutes !== undefined && (
            <span className="text-slate-500">~{formatEffort(task.effortMinutes)}</span>
          )}
          {project && <LabelChip name={project.name} color={project.color} prefix="@" />}
          {task.tagIds.map((id) => {
            const tag = tagsById.get(id)
            return tag ? <LabelChip key={id} name={tag.name} color={tag.color} prefix="#" /> : null
          })}
        </div>
      </button>
    </li>
  )
}
