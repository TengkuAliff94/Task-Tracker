import { Bell, CalendarDays, ChevronRight, Clock, ListChecks, Paperclip, Repeat } from 'lucide-react'
import { taskRepo } from '../db/tasks'
import { formatDeadline, isOverdue } from '../lib/deadline'
import { formatEffort } from '../lib/effort'
import { describeRecurrence } from '../lib/recurrence'
import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Task } from '../types'
import { ALERT_OUTLINE, panel, PRIORITY_PANEL, SELECTED_OUTLINE } from '../ui'
import { LabelChip } from './LabelChip'
import { AnimatedItem } from './motion/AnimatedList'
import { celebrate } from './motion/Burst'

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

/**
 * One task as a card in an `AnimatedList`. The stripe down its left edge is the priority colour;
 * an overdue card gets a maroon outline as well as its badge. Completing it marks it done at once
 * and sets off a short celebration from its checkbox (none under reduced motion).
 */
export function TaskCard({ task, now, projectsById, tagsById, attachmentCount, selected, onEdit, index = 0 }: Props) {
  const overdue = isOverdue(task, now)
  const done = task.status === 'done'
  const project = task.projectId ? projectsById.get(task.projectId) : undefined
  const checked = task.checklist.filter((c) => c.done).length

  // Selection uses an outline, not colour alone, so it reads in any theme and on any card.
  const outline = selected ? SELECTED_OUTLINE : overdue ? ALERT_OUTLINE : ''

  return (
    <AnimatedItem
      index={index}
      data-task-id={task.id}
      aria-current={selected || undefined}
      lift
      className={`group relative flex items-start gap-3.5 overflow-hidden rounded-panel bg-surface py-4 pr-4 pl-5 shadow-card transition-[background-color,box-shadow] duration-200 hover:bg-hover hover:shadow-pop ${outline}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${PRIORITY_PANEL[task.priority]}`} />
      <input
        type="checkbox"
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        checked={done}
        onChange={(e) => {
          if (!done) celebrate(e.currentTarget)
          taskRepo.setStatus(task.id, done ? 'todo' : 'done')
        }}
        className="task-check mt-px"
      />
      <button onClick={onEdit} className="min-w-0 flex-1 text-left focus-visible:outline-offset-4">
        <div
          className={`line-clamp-2 text-[15px] leading-5 font-medium break-words transition-colors duration-200 ${
            done ? 'text-muted line-through decoration-muted/60' : ''
          }`}
        >
          {task.title}
        </div>
        {/* Completed tasks keep full-strength metadata: fading it would push the text below 4.5:1. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
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
        className="mt-0.5 size-4 shrink-0 text-muted opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 max-sm:hidden"
        aria-hidden
      />
    </AnimatedItem>
  )
}
