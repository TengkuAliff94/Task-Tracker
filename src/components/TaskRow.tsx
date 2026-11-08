import { Bell, CalendarDays, ChevronRight, Clock, ListChecks, Paperclip, Repeat } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { formatDeadline, isOverdue } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { describeRecurrence } from '../lib/recurrence'
import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Task } from '../types'
import { panel, PRIORITY_PANEL } from '../ui'
import { LabelChip } from './LabelChip'

interface Props {
  task: Task
  now: Date
  projectsById: Map<string, Label>
  tagsById: Map<string, Label>
  attachmentCount: number
  selected: boolean
  onEdit: () => void
  /** Position in its list, for a short staggered entrance. */
  index?: number
}

const meta = 'inline-flex items-center gap-1 text-muted'
const badge = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium'

export function TaskRow({ task, now, projectsById, tagsById, attachmentCount, selected, onEdit, index = 0 }: Props) {
  const overdue = isOverdue(task, now)
  const done = task.status === 'done'
  const project = task.projectId ? projectsById.get(task.projectId) : undefined
  const checked = task.checklist.filter((c) => c.done).length

  return (
    <li
      data-task-id={task.id}
      aria-current={selected || undefined}
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
      className={`group relative flex animate-fade-up items-start gap-3.5 px-4 py-3.5 transition-colors duration-200 hover:bg-hover sm:px-5 ${
        selected ? 'bg-primary-soft shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary-soft' : ''
      }`}
    >
      <input
        type="checkbox"
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        checked={done}
        onChange={() => taskRepo.setStatus(task.id, done ? 'todo' : 'done')}
        className="task-check mt-px"
      />
      <button onClick={onEdit} className="min-w-0 flex-1 text-left focus-visible:outline-offset-4">
        <div
          className={`truncate text-[15px] leading-5 font-medium transition-colors duration-200 ${
            done ? 'text-muted line-through decoration-muted/60' : ''
          }`}
        >
          {task.title}
        </div>
        {/* Completed tasks keep full-strength metadata: fading it would push the text below 4.5:1. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
          <span className={`${badge} ${PRIORITY_PANEL[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
          {task.status === 'in_progress' && <span className={`${badge} ${panel.info}`}>{STATUS_LABEL.in_progress}</span>}
          {overdue && <span className={`${badge} ${panel.critical}`}>Overdue</span>}
          {task.deadline && (
            <span className={overdue ? 'inline-flex items-center gap-1 font-medium text-danger' : meta}>
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDeadline(task.deadline, now)}
            </span>
          )}
          {task.recurrence && (
            <span className={meta} title="Repeats">
              <Repeat className="size-3.5" role="img" aria-label="Repeats" /> {describeRecurrence(task.recurrence)}
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
      <ChevronRight
        className="mt-0.5 size-4 shrink-0 text-muted opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 max-sm:hidden"
        aria-hidden
      />
    </li>
  )
}
