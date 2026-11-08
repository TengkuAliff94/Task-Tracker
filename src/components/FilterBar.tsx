import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { EMPTY_FILTERS, hasActiveFilters, NO_PROJECT, type Filters } from '../lib/filter'
import { GROUP_LABEL, SORT_LABEL, type GroupKey, type SortKey } from '../lib/sort'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Label } from '../types'
import { labelTint } from '../lib/colors'
import { card, hoverHighlight, panel, PRIORITY_PANEL, STATUS_PANEL } from '../ui'

interface Props {
  filters: Filters
  onFilters: (f: Filters) => void
  sort: SortKey
  onSort: (s: SortKey) => void
  group: GroupKey
  onGroup: (g: GroupKey) => void
  projects: Label[]
  tags: Label[]
  doneCount: number
}

/** A flat well like the form fields: no outline at rest, a border on hover and focus. */
const select =
  'h-9 rounded-lg border border-transparent bg-subtle px-2.5 text-sm text-fg transition-[border-color,box-shadow] duration-200 hover:border-line-strong focus:border-ring focus:shadow-[0_0_0_3px_var(--primary-soft)]'

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

interface PillProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  /** Classes for the pressed state: a panel colour (default: the brand panel). */
  activeTone?: string
  /** A user-picked label colour, shown as a dot and (when pressed) a tint, like a label chip. */
  color?: string
}

/**
 * A filter toggle. Unpressed it's a quiet well that lights up mustard on hover (Sill's hover);
 * pressed it takes its own panel colour. A tag pill keeps body-coloured text on its tint, so any
 * colour the user picked stays readable.
 */
function Pill({ active, onClick, children, activeTone = panel.brand, color }: PillProps) {
  const tone = !active ? `bg-subtle text-fg/80 ${hoverHighlight}` : color ? 'text-fg ring-2 ring-inset' : activeTone
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors duration-200 ${tone}`}
      style={active && color ? labelTint(color, 22) : undefined}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {children}
    </button>
  )
}

/** A cluster of related pills; clusters are set apart by space, not a rule. */
const Cluster = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-1.5">{children}</div>

export function FilterBar({ filters: f, onFilters, sort, onSort, group, onGroup, projects, tags, doneCount }: Props) {
  const set = (patch: Partial<Filters>) => onFilters({ ...f, ...patch })

  return (
    <div className={`${card} mb-6 space-y-3 p-3 sm:p-4`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_9rem]">
        <div className="relative col-span-2 min-w-0 sm:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="search"
            type="search"
            value={f.query}
            onChange={(e) => set({ query: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className={`${select} w-full pr-9 pl-8 [&::-webkit-search-cancel-button]:hidden`}
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 max-sm:hidden" aria-hidden>
            /
          </kbd>
        </div>
        <select aria-label="Filter by project" value={f.projectId ?? ''} onChange={(e) => set({ projectId: e.target.value || undefined })} className={`${select} min-w-0`}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value={NO_PROJECT}>No project</option>
        </select>
        <select aria-label="Sort by" value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className={`${select} min-w-0 truncate`}>
          {Object.entries(SORT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>Sort: {v}</option>
          ))}
        </select>
        <select aria-label="Group by" value={group} onChange={(e) => onGroup(e.target.value as GroupKey)} className={`${select} min-w-0 truncate`}>
          {Object.entries(GROUP_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{k === 'none' ? v : `Group: ${v}`}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Cluster>
          {PRIORITIES.map((p) => (
            <Pill key={p} activeTone={PRIORITY_PANEL[p]} active={f.priorities.includes(p)} onClick={() => set({ priorities: toggle(f.priorities, p) })}>
              {PRIORITY_LABEL[p]}
            </Pill>
          ))}
        </Cluster>
        <Cluster>
          {STATUSES.map((s) => (
            <Pill key={s} activeTone={STATUS_PANEL[s]} active={f.statuses.includes(s)} onClick={() => set({ statuses: toggle(f.statuses, s) })}>
              {STATUS_LABEL[s]}
            </Pill>
          ))}
        </Cluster>
        {tags.length > 0 && (
          <Cluster>
            {tags.map((t) => (
              <Pill key={t.id} color={t.color} active={f.tagIds.includes(t.id)} onClick={() => set({ tagIds: toggle(f.tagIds, t.id) })}>
                #{t.name}
              </Pill>
            ))}
          </Cluster>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <label className="flex cursor-pointer items-center gap-2 font-medium">
          <input type="checkbox" checked={f.showCompleted} onChange={(e) => set({ showCompleted: e.target.checked })} className="accent-primary" />
          Show completed ({doneCount})
        </label>
        {hasActiveFilters(f) && (
          <button type="button" onClick={() => onFilters({ ...EMPTY_FILTERS, showCompleted: f.showCompleted })} className={`rounded-full px-3 py-1 text-xs font-semibold text-fg transition-colors ${hoverHighlight}`}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
