import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { EMPTY_FILTERS, hasActiveFilters, NO_PROJECT, type Filters } from '../lib/filter'
import { GROUP_LABEL, SORT_LABEL, type GroupKey, type SortKey } from '../lib/sort'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Label } from '../types'
import { card } from '../ui'

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

const select = 'rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm focus:border-ring focus:outline-none'

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function Pill({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors duration-200 ${
        active ? 'border-primary bg-primary text-on-primary' : 'border-line-strong text-muted hover:bg-subtle hover:text-fg'
      }`}
      style={active && color ? { backgroundColor: color, borderColor: color, color: '#fff' } : undefined}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 h-4 w-px bg-line-strong" aria-hidden />

export function FilterBar({ filters: f, onFilters, sort, onSort, group, onGroup, projects, tags, doneCount }: Props) {
  const set = (patch: Partial<Filters>) => onFilters({ ...f, ...patch })

  return (
    <div className={`${card} mb-4 space-y-3 p-3`}>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 basis-48">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="search"
            type="search"
            value={f.query}
            onChange={(e) => set({ query: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className={`${select} w-full pl-8`}
          />
        </div>
        <select aria-label="Filter by project" value={f.projectId ?? ''} onChange={(e) => set({ projectId: e.target.value || undefined })} className={select}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value={NO_PROJECT}>No project</option>
        </select>
        <select aria-label="Sort by" value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className={select}>
          {Object.entries(SORT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>Sort: {v}</option>
          ))}
        </select>
        <select aria-label="Group by" value={group} onChange={(e) => onGroup(e.target.value as GroupKey)} className={select}>
          {Object.entries(GROUP_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{k === 'none' ? v : `Group: ${v}`}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRIORITIES.map((p) => (
          <Pill key={p} active={f.priorities.includes(p)} onClick={() => set({ priorities: toggle(f.priorities, p) })}>
            {PRIORITY_LABEL[p]}
          </Pill>
        ))}
        <Divider />
        {STATUSES.map((s) => (
          <Pill key={s} active={f.statuses.includes(s)} onClick={() => set({ statuses: toggle(f.statuses, s) })}>
            {STATUS_LABEL[s]}
          </Pill>
        ))}
        {tags.length > 0 && <Divider />}
        {tags.map((t) => (
          <Pill key={t.id} color={t.color} active={f.tagIds.includes(t.id)} onClick={() => set({ tagIds: toggle(f.tagIds, t.id) })}>
            #{t.name}
          </Pill>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.showCompleted} onChange={(e) => set({ showCompleted: e.target.checked })} className="accent-primary" />
          Show completed ({doneCount})
        </label>
        {hasActiveFilters(f) && (
          <button type="button" onClick={() => onFilters({ ...EMPTY_FILTERS, showCompleted: f.showCompleted })} className="text-primary hover:underline">
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
