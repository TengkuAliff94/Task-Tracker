import { Bell, CalendarDays, ChevronRight, Clock, ListChecks, Paperclip, Repeat, type LucideIcon } from 'lucide-react'
import { formatDeadline, isOverdue } from '../lib/deadline'
import { describeEffort, formatEffort } from '../lib/effort'
import { describeRecurrence } from '../lib/recurrence'
import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Task } from '../types'
import { ALERT_OUTLINE, panel, PRIORITY_PANEL, SELECTED_OUTLINE } from '../ui'
import { LabelChip } from './LabelChip'
import { AnimatedItem } from './motion/AnimatedList'

interface Props {
  task: Task
  now: Date
  projectsById: Map<string, Label>
  tagsById: Map<string, Label>
  attachmentCount: number
  selected: boolean
  onEdit: () => void
  /** Ticks or unticks the task. `from` is the checkbox, where the completion celebration starts. */
  onToggleDone: (from: HTMLInputElement) => void
  /** Position in its list, for a short staggered entrance. */
  index?: number
}

const meta = 'inline-flex items-center gap-1 text-muted'
const badge = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * An icon and a short figure ("2", "1/3", "30m") that only make sense together. A screen reader
 * gets the words instead ("2 reminders"), which also show as the tooltip.
 */
function Meta({ icon: Icon, shown, spoken }: { icon: LucideIcon; shown: string; spoken: string }) {
  return (
    <span className={meta} title={spoken}>
      <Icon className="size-3.5" aria-hidden />
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  )
}

/**
 * One task as a card in an `AnimatedList`. The stripe down its left edge is the priority colour;
 * an overdue card gets a maroon outline as well as its badge. Ticking it hands over to the app,
 * which saves it, celebrates and offers Undo (see `setDone` in App.tsx).
 */
export function TaskCard({ task, now, projectsById, tagsById, attachmentCount, selected, onEdit, onToggleDone, index = 0 }: Props) {
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
      {/* The label pads the 20px circle out to a 44px touch target without moving it. */}
      <label className="-m-3 grid shrink-0 p-3">
        <input
          type="checkbox"
          aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          checked={done}
          onChange={(e) => onToggleDone(e.currentTarget)}
          className="task-check mt-px"
        />
      </label>
      <button onClick={onEdit} data-card-edit className="min-w-0 flex-1 rounded-lg text-left">
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
              <span className="sr-only">Due </span>
              <span>{formatDeadline(task.deadline, now)}</span>
            </span>
          )}
          {task.recurrence && (
            <span className={meta} title="Repeats">
              <Repeat className="size-3.5" role="img" aria-label="Repeats" /> {describeRecurrence(task.recurrence)}
            </span>
          )}
          {task.reminders.length > 0 && (
            <Meta icon={Bell} shown={String(task.reminders.length)} spoken={plural(task.reminders.length, 'reminder')} />
          )}
          {task.checklist.length > 0 && (
            <Meta
              icon={ListChecks}
              shown={`${checked}/${task.checklist.length}`}
              spoken={`Checklist: ${checked} of ${task.checklist.length} done`}
            />
          )}
          {attachmentCount > 0 && <Meta icon={Paperclip} shown={String(attachmentCount)} spoken={plural(attachmentCount, 'attachment')} />}
          {task.effortMinutes !== undefined && (
            <Meta icon={Clock} shown={formatEffort(task.effortMinutes)} spoken={`Effort: ${describeEffort(task.effortMinutes)}`} />
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
