import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { EMPTY_FILTERS, filterChips, hasActiveFilters, NO_PROJECT, removeChip, type FilterChip, type Filters } from '../lib/filter'
import { GROUP_LABEL, SORT_LABEL, type GroupKey, type SortKey } from '../lib/sort'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Label } from '../types'
import { labelTint } from '../lib/colors'
import { card, hoverHighlight, labelText, panel, PRIORITY_PANEL, STATUS_PANEL } from '../ui'
import { Reveal } from './motion/Reveal'

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
  'h-9 w-full min-w-0 rounded-lg border border-transparent bg-subtle px-2.5 text-sm text-fg transition-[border-color,box-shadow] duration-200 placeholder:text-muted hover:border-line-strong focus:border-ring focus:shadow-[0_0_0_3px_var(--primary-soft)]'

/** The 32px pill shared by the filter toggles, the active-filter chips and Clear filters. */
const pill = 'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200'

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

/** A user-picked label colour, pressed: body text on its tint with an inset ring (the Readable Label Rule). */
const labelPressed = 'text-fg ring-2 ring-inset'

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
  const tone = !active ? `bg-subtle text-fg/80 ${hoverHighlight}` : color ? labelPressed : activeTone
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${pill} ${tone}`} style={active && color ? labelTint(color, 22) : undefined}>
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {children}
    </button>
  )
}

/** The pressed look of each chip, so a collapsed chip matches the pill it stands for. */
function chipTone(chip: FilterChip): { className: string; color?: string } {
  switch (chip.kind) {
    case 'priority':
      return { className: PRIORITY_PANEL[chip.value] }
    case 'status':
      return { className: STATUS_PANEL[chip.value] }
    case 'tag':
      return { className: labelPressed, color: chip.color }
    case 'project':
      return chip.color ? { className: labelPressed, color: chip.color } : { className: 'bg-subtle text-fg' }
  }
}

/** An active filter while the panel is collapsed. Pressing it takes the filter off. */
function Chip({ chip, onRemove }: { chip: FilterChip; onRemove: () => void }) {
  const { className, color } = chipTone(chip)
  return (
    <button
      type="button"
      data-chip
      onClick={onRemove}
      aria-label={`Remove ${chip.label} filter`}
      className={`${pill} pr-2.5 hover:shadow-pop ${className}`}
      style={color ? labelTint(color, 22) : undefined}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {chip.label}
      <X className="size-3.5 opacity-75" aria-hidden />
    </button>
  )
}

/** A cluster of related pills; clusters are set apart by space, not a rule. */
const Cluster = ({ label, children }: { label: string; children: ReactNode }) => (
  <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
    {children}
  </div>
)

/** A select with its name above it. */
const Field = ({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) => (
  <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <span className={labelText}>{label}</span>
    {children}
  </label>
)

/**
 * Search, always in view (`/` focuses it), and a Filters disclosure holding everything else. While
 * the panel is collapsed, each active filter shows as a chip beside it that removes that filter, so
 * the list is never narrowed by something out of sight.
 */
export function FilterBar({ filters: f, onFilters, sort, onSort, group, onGroup, projects, tags, doneCount }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const chipRowRef = useRef<HTMLDivElement>(null)
  /** Where focus goes once a chip or Clear filters has gone: the chip now at that index, or the toggle. */
  const refocus = useRef<number | 'toggle' | null>(null)

  const set = (patch: Partial<Filters>) => onFilters({ ...f, ...patch })
  const chips = filterChips(f, projects, tags)
  const active = hasActiveFilters(f)

  // Removing a chip unmounts the button that had focus. Hand focus to the chip that took its place,
  // or the one before it, never to Clear filters (a second Enter would wipe the rest). Once no chip
  // is left: Clear filters if search or a tile still filters, else the Filters button.
  useEffect(() => {
    const target = refocus.current
    if (target === null) return
    refocus.current = null
    const row = chipRowRef.current
    const left = row?.querySelectorAll<HTMLButtonElement>('[data-chip]')
    const next =
      target === 'toggle' ? null : left?.length ? left[Math.min(target, left.length - 1)] : row?.querySelector<HTMLButtonElement>('[data-clear]')
    ;(next ?? toggleRef.current)?.focus()
  })

  const clear = () => {
    refocus.current = 'toggle'
    onFilters({ ...EMPTY_FILTERS, showCompleted: f.showCompleted })
  }
  const clearButton = active && (
    <button type="button" data-clear onClick={clear} className={`${pill} text-fg ${hoverHighlight}`}>
      Clear filters
    </button>
  )

  return (
    <div data-filter-bar className={`${card} p-3 sm:p-4`}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="search"
            type="search"
            value={f.query}
            onChange={(e) => set({ query: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className={`${select} pr-9 pl-8 [&::-webkit-search-cancel-button]:hidden`}
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 max-sm:hidden" aria-hidden>
            /
          </kbd>
        </div>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-subtle px-3 text-sm font-medium text-fg transition-colors duration-200 ${hoverHighlight}`}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters
          {/* The same count pill as the group headings: a tint of the button's own ink, so it follows the mustard hover. */}
          {chips.length > 0 && (
            <span className="rounded-full bg-current/15 px-2 py-px text-xs font-semibold tabular-nums">
              {chips.length}
              <span className="sr-only"> active</span>
            </span>
          )}
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>

      {!open && active && (
        <div ref={chipRowRef} className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip, i) => (
            <Chip
              key={chip.key}
              chip={chip}
              onRemove={() => {
                refocus.current = i
                onFilters(removeChip(f, chip))
              }}
            />
          ))}
          {clearButton}
        </div>
      )}

      {/* Always in the DOM so the toggle's aria-controls points at something; filled only while open. */}
      <div id={panelId} hidden={!open}>
        {open && (
          <Reveal className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
              <Field label="Project" className="col-span-2 sm:col-span-1">
                <select aria-label="Filter by project" value={f.projectId ?? ''} onChange={(e) => set({ projectId: e.target.value || undefined })} className={select}>
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value={NO_PROJECT}>No project</option>
                </select>
              </Field>
              <Field label="Sort by">
                <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className={select}>
                  {Object.entries(SORT_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Group by">
                <select value={group} onChange={(e) => onGroup(e.target.value as GroupKey)} className={select}>
                  {Object.entries(GROUP_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* 12px between clusters against 6px inside one, so wrapped clusters still read apart. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Cluster label="Priority">
                {PRIORITIES.map((p) => (
                  <Pill key={p} activeTone={PRIORITY_PANEL[p]} active={f.priorities.includes(p)} onClick={() => set({ priorities: toggle(f.priorities, p) })}>
                    {PRIORITY_LABEL[p]}
                  </Pill>
                ))}
              </Cluster>
              <Cluster label="Status">
                {STATUSES.map((s) => (
                  <Pill key={s} activeTone={STATUS_PANEL[s]} active={f.statuses.includes(s)} onClick={() => set({ statuses: toggle(f.statuses, s) })}>
                    {STATUS_LABEL[s]}
                  </Pill>
                ))}
              </Cluster>
              {tags.length > 0 && (
                <Cluster label="Tags">
                  {tags.map((t) => (
                    <Pill key={t.id} color={t.color} active={f.tagIds.includes(t.id)} onClick={() => set({ tagIds: toggle(f.tagIds, t.id) })}>
                      #{t.name}
                    </Pill>
                  ))}
                </Cluster>
              )}
            </div>

            <div className="flex min-h-8 items-center justify-between gap-3 text-sm text-muted">
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" checked={f.showCompleted} onChange={(e) => set({ showCompleted: e.target.checked })} className="accent-primary" />
                Show completed ({doneCount})
              </label>
              {clearButton}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}
