import { useRef } from 'react'
import { Bell, CalendarArrowUp, CalendarDays, CalendarRange, ChevronRight, Clock, ListChecks, Paperclip, Repeat, Sunrise, type LucideIcon } from 'lucide-react'
import { formatDeadline, isOverdue } from '../lib/deadline'
import { describeEffort, formatEffort } from '../lib/effort'
import { describeRecurrence } from '../lib/recurrence'
import { PRIORITY_LABEL, STATUS_LABEL, type Label, type Task } from '../types'
import { ALERT_OUTLINE, btn, panel, PRIORITY_TONE } from '../ui'
import { cn } from '../lib/utils'
import { Menu } from './Menu'
import { LabelChip } from './LabelChip'
import { PriorityGlyph } from './PriorityGlyph'
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
  /** Leaves out the `@project` chip, when the list is grouped by project and the heading already says it. */
  hideProject?: boolean
  /** Leaves out the priority badge, when the list is grouped by priority and the heading already says it. */
  hidePriority?: boolean
  /** Moves the deadline to `days` after today (Move to → Tomorrow, Next week). Offered on overdue cards. */
  onMove?: (days: number) => void
  /** Opens the editor at the deadline (Move to → Pick a date…). */
  onPickDate?: () => void
}

const meta = 'inline-flex items-center gap-1 text-muted'
const badge = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium'

const MAX_TAGS = 3

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * An icon and a short figure ("2", "1/3", "30m") that only make sense together. A screen reader
 * gets the words instead ("2 reminders"), which also show as the tooltip.
 */
function Meta({ icon: Icon, shown, spoken }: { icon: LucideIcon; shown: string; spoken: string }) {
  return (
    // Counts are the least of the card, so phones leave them to the editor (from `sm` on they show).
    <span data-meta="count" className={`${meta} max-sm:hidden`} title={spoken}>
      <Icon className="size-3.5" aria-hidden />
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  )
}

/**
 * One task as a card in an `AnimatedList`. Each kind of mark has its own form: an Urgent task
 * has an ink priority badge, an overdue card a maroon outline and a red date, and the selected card (J/K, or Tab) lifts with an ink marker in the gutter beside it. Ticking it hands over to the app,
 * which saves it, celebrates and offers Undo (see `setDone` in App.tsx).
 */
export function TaskCard({
  task,
  now,
  projectsById,
  tagsById,
  attachmentCount,
  selected,
  onEdit,
  onToggleDone,
  index = 0,
  hideProject = false,
  hidePriority = false,
  onMove,
  onPickDate,
}: Props) {
  const overdue = isOverdue(task, now)
  const titleRef = useRef<HTMLButtonElement>(null)
  const focusTitle = () => titleRef.current?.focus({ preventScroll: true })
  const done = task.status === 'done'
  const project = task.projectId && !hideProject ? projectsById.get(task.projectId) : undefined
  const checked = task.checklist.filter((c) => c.done).length
  // Three tags at most, so a well-tagged task stays one line of labels; "+N" names the rest.
  const tags = task.tagIds.flatMap((id) => tagsById.get(id) ?? [])
  const shownTags = tags.slice(0, MAX_TAGS)
  const hiddenTags = tags.slice(MAX_TAGS)

  return (
    <AnimatedItem
      index={index}
      data-task-id={task.id}
      aria-current={selected || undefined}
      lift
      className={`group relative flex items-start gap-3.5 rounded-panel bg-surface py-4 pr-4 pl-5 transition-[background-color,box-shadow] duration-200 hover:bg-hover hover:shadow-pop ${
        selected ? 'shadow-pop' : 'shadow-card'
      } ${overdue ? ALERT_OUTLINE : ''}`}
    >
      {/* Selection's own form, outside the card so it never meets the outline: a short
          ink bar in the gutter, 7px out, so on two columns it sits nearer its card than the neighbour. */}
      <span
        aria-hidden
        data-selection-marker
        className={`pointer-events-none absolute inset-y-3 -left-[7px] w-1 rounded-full bg-fg transition-[opacity,scale] duration-200 motion-reduce:transition-none ${
          selected ? 'opacity-100' : 'scale-y-0 opacity-0'
        }`}
      />
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
      <button ref={titleRef} onClick={onEdit} data-card-edit className="min-w-0 flex-1 rounded-lg text-left">
        <div
          className={`line-clamp-2 text-[15px] leading-5 font-medium break-words transition-colors duration-200 ${
            done ? 'text-muted line-through decoration-muted/60' : ''
          }`}
        >
          {task.title}
        </div>
        {/* Completed tasks keep full-strength metadata: fading it would push the text below 4.5:1.
            One reading order (step 24): when, then what, then labels, then counts. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
          {task.deadline && (
            // Overdue is said once: the card's ring and this red date. The words carry it too, for
            // assistive tech and as the tooltip, so it never rests on colour alone.
            <span
              data-meta="when"
              data-overdue={overdue || undefined}
              title={overdue ? 'Overdue' : undefined}
              className={overdue ? 'inline-flex items-center gap-1 font-medium text-danger' : meta}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              <span className="sr-only">{overdue ? 'Overdue, due ' : 'Due '}</span>
              <span>{formatDeadline(task.deadline, now)}</span>
            </span>
          )}
          {task.recurrence && (
            <span data-meta="when" className={meta} title="Repeats">
              <Repeat className="size-3.5" role="img" aria-label="Repeats" /> {describeRecurrence(task.recurrence)}
            </span>
          )}
          {/* Medium is the default, so it isn't drawn: the badge only shows when priority says something. */}
          {task.priority !== 'medium' && !hidePriority && (
            <span data-meta="what" data-priority={task.priority} className={`${badge} ${PRIORITY_TONE[task.priority].badge}`}>
              <PriorityGlyph priority={task.priority} />
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          {task.status === 'in_progress' && (
            <span data-meta="what" className={`${badge} ${panel.info}`}>
              {STATUS_LABEL.in_progress}
            </span>
          )}
          {project && <LabelChip data-meta="label" name={project.name} color={project.color} prefix="@" />}
          {shownTags.map((tag) => (
            // On phones tags drop their tint and ring to a dot and the name, so a row of them stops reading as
            // a row of buttons; the project keeps its chip, as the one label that groups.
            <LabelChip key={tag.id} data-meta="label" data-tag name={tag.name} color={tag.color} prefix="#" quiet="phone" />
          ))}
          {hiddenTags.length > 0 && (
            <span
              data-meta="label"
              data-tag-more
              title={hiddenTags.map((t) => `#${t.name}`).join(', ')}
              className="inline-flex items-center rounded-md bg-subtle px-1.5 py-0.5 font-medium text-muted max-sm:bg-transparent max-sm:px-0"
            >
              <span aria-hidden>+{hiddenTags.length}</span>
              <span className="sr-only">
                {plural(hiddenTags.length, 'more tag')}: {hiddenTags.map((t) => `#${t.name}`).join(', ')}
              </span>
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
        </div>
      </button>
      {/* Overdue is the one state with an obvious next step, so it gets one: a quick reschedule beside the
          red date's card, instead of the full editor. Its own button, since the card's text is the edit button. */}
      {overdue && onMove && (
        <Menu
          label={`Move “${task.title}” to…`}
          title="Move to…"
          triggerClassName={cn(btn.small, '-my-1 shrink-0 gap-1 font-medium text-muted hover:text-fg')}
          // Focus goes to the card's title first: once it isn't overdue, this button goes, and focus with
          // it would drop to the page (the editor would hand it back to a button that's gone, too).
          entries={[
            { kind: 'action', label: 'Tomorrow', icon: Sunrise, hint: 'T', onSelect: () => (focusTitle(), onMove(1)) },
            { kind: 'action', label: 'Next week', icon: CalendarRange, onSelect: () => (focusTitle(), onMove(7)) },
            ...(onPickDate ? [{ kind: 'action' as const, label: 'Pick a date…', icon: CalendarDays, onSelect: () => (focusTitle(), onPickDate()) }] : []),
          ]}
        >
          <CalendarArrowUp className="size-3.5" aria-hidden />
          Move
        </Menu>
      )}
      {!(overdue && onMove) && <ChevronRight
        className="mt-0.5 size-4 shrink-0 text-muted opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 max-sm:hidden"
        aria-hidden
      />}
    </AnimatedItem>
  )
}
