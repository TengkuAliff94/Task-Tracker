import { Bell, Clock, ListChecks, Paperclip, Repeat } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { formatDeadline, isOverdue } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { describeRecurrence } from '../lib/recurrence'
import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Priority, type Task } from '../types'
import { LabelChip } from './LabelChip'

const PRIORITY_STYLE: Record<Priority, string> = {
  low: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  medium: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  high: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  urgent: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

interface Props {
  task: Task
  now: Date
  projectsById: Map<string, Label>
  tagsById: Map<string, Label>
  attachmentCount: number
  selected: boolean
  onEdit: () => void
}

const meta = 'inline-flex items-center gap-1 text-muted'

export function TaskRow({ task, now, projectsById, tagsById, attachmentCount, selected, onEdit }: Props) {
  const overdue = isOverdue(task, now)
  const done = task.status === 'done'
  const project = task.projectId ? projectsById.get(task.projectId) : undefined
  const checked = task.checklist.filter((c) => c.done).length

  return (
    <li
      data-task-id={task.id}
      aria-current={selected || undefined}
      className={`flex items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-subtle ${
        selected ? 'bg-subtle shadow-[inset_3px_0_0_var(--primary)]' : ''
      }`}
    >
      <input
        type="checkbox"
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        checked={done}
        onChange={() => taskRepo.setStatus(task.id, done ? 'todo' : 'done')}
        className="mt-0.5 size-4 accent-primary"
      />
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className={`truncate font-medium ${done ? 'text-muted line-through' : ''}`}>{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <span className={`rounded px-1.5 py-0.5 font-medium ${PRIORITY_STYLE[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.status === 'in_progress' && (
            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-medium text-violet-700 dark:text-violet-300">
              {STATUS_LABEL.in_progress}
            </span>
          )}
          {overdue && <span className="rounded bg-danger px-1.5 py-0.5 font-semibold text-white dark:text-black">Overdue</span>}
          {task.deadline && (
            <span className={overdue ? 'font-medium text-danger' : 'text-muted'}>{formatDeadline(task.deadline, now)}</span>
          )}
          {task.recurrence && (
            <span className={meta} title="Repeats">
              <Repeat className="size-3.5" aria-hidden /> {describeRecurrence(task.recurrence)}
            </span>
          )}
          {task.reminders.length > 0 && (
            <span className={meta} title={`${task.reminders.length} reminder(s)`}>
              <Bell className="size-3.5" aria-hidden /> {task.reminders.length}
            </span>
          )}
          {task.checklist.length > 0 && (
            <span className={meta} title="Checklist">
              <ListChecks className="size-3.5" aria-hidden /> {checked}/{task.checklist.length}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className={meta} title="Attachments">
              <Paperclip className="size-3.5" aria-hidden /> {attachmentCount}
            </span>
          )}
          {task.effortMinutes !== undefined && (
            <span className={meta} title="Effort">
              <Clock className="size-3.5" aria-hidden /> {formatEffort(task.effortMinutes)}
            </span>
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
