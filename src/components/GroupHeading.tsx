import { labelTint } from '../lib/colors'
import type { GroupKey, TaskGroup } from '../lib/sort'
import type { Priority, Status } from '../types'
import { PRIORITY_TONE, STATUS_PANEL } from '../ui'
import { PriorityGlyph } from './PriorityGlyph'

/**
 * A group's heading as a tab with its task count. Status groups take their panel colour; priority
 * groups are a neutral tab with the priority's glyph (Urgent in ink); project groups take the project's own colour as a dot and tint (the text stays in
 * the body colour so any colour the user picked stays readable).
 */
export function GroupHeading({ by, group }: { by: GroupKey; group: TaskGroup }) {
  const tab = 'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5'
  const count = 'rounded-full bg-current/15 px-2 py-px text-xs font-semibold tabular-nums'

  let tone = 'bg-subtle text-fg'
  if (by === 'priority') tone = PRIORITY_TONE[group.key as Priority].badge
  else if (by === 'status') tone = STATUS_PANEL[group.key as Status]

  return (
    <h2 className="mb-3 font-display text-base font-bold">
      <span
        className={`${tab} ${group.color ? 'text-fg ring-1 ring-inset' : tone}`}
        style={group.color ? labelTint(group.color, 16) : undefined}
      >
        {group.color && <span className="size-2.5 rounded-full" style={{ backgroundColor: group.color }} aria-hidden />}
        {by === 'priority' && <PriorityGlyph priority={group.key as Priority} className="size-3.5" />}
        {group.label}
        <span className={count}>{group.tasks.length}</span>
      </span>
    </h2>
  )
}
