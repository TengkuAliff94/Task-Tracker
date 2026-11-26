import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotionConfig } from 'motion/react'
import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  EMPTY_FILTERS,
  filterChips,
  NO_PROJECT,
  removeChip,
  showsCompleted,
  withShowCompleted,
  type FilterChip,
  type Filters,
} from '../lib/filter'
import { GROUP_LABEL, SORT_LABEL, type GroupKey, type SortKey } from '../lib/sort'
import { OPEN_STATUSES, PRIORITIES, PRIORITY_LABEL, STATUS_LABEL, type Label } from '../types'
import { labelTint } from '../lib/colors'
import { card, hoverHighlight, labelText, panel, PRIORITY_TONE, STATUS_PANEL } from '../ui'
import { PriorityGlyph } from './PriorityGlyph'
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
  /** Nothing lists: the empty state offers Clear filters, so the bar doesn't say it a second time. */
  listEmpty?: boolean
}

/** A flat well like the form fields: no outline at rest, a border on hover and focus. */
const select =
  'h-9 w-full min-w-0 rounded-lg border border-transparent bg-subtle px-2.5 text-sm text-fg transition-[border-color,box-shadow] duration-200 placeholder:text-muted hover:border-line-strong focus:border-ring focus:shadow-[0_0_0_3px_var(--primary-soft)]'

/** The 32px pill shared by the filter toggles, the active-filter chips and Clear filters. */
const pillClass = 'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200'

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
    <button type="button" onClick={onClick} aria-pressed={active} className={`${pillClass} ${tone}`} style={active && color ? labelTint(color, 22) : undefined}>
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {children}
    </button>
  )
}

/** The pressed look of each chip, so a collapsed chip matches the pill it stands for. */
function chipTone(chip: FilterChip): { className: string; color?: string } {
  switch (chip.kind) {
    case 'priority':
      return { className: PRIORITY_TONE[chip.value].pressed }
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
      className={`${pillClass} pr-2.5 hover:shadow-pop ${className}`}
      style={color ? labelTint(color, 22) : undefined}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {chip.kind === 'priority' && <PriorityGlyph priority={chip.value} />}
      {chip.label}
      <X className="size-3.5 opacity-75" aria-hidden />
    </button>
  )
}

/**
 * A cluster of related pills under its visible name, which also names the group. On phones the name
 * is a narrow column to the left (no extra row); from sm it sits above, like the selects' labels.
 */
function Cluster({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-2 sm:flex sm:flex-col sm:gap-1">
      {/* pt centres the name on the first row of 32px pills. */}
      <span id={id} className={`${labelText} max-sm:pt-1.5`}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}

/**
 * One of the panel's two jobs, named: "Show" narrows what lists, "Arrange" orders what lists. The
 * title is body-sized semibold ink, a step above the Field Labels it holds.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} data-filter-section={title} className="space-y-3">
      <h2 id={id} className="text-sm font-semibold text-fg">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Tags shown before the rest fold behind "N more": past this, the cluster becomes a wall. */
export const TAG_LIMIT = 4

/**
 * The Tags cluster, bounded. Up to TAG_LIMIT + 1 tags show as pills; past that, the picked ones
 * and the first few show, and "N more" opens a search over all of them, so a long tag list never
 * buries the panel. A picked tag is always in view.
 */
function TagCluster({ tags, picked, onToggle }: { tags: Label[]; picked: string[]; onToggle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const findRef = useRef<HTMLInputElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const folds = tags.length > TAG_LIMIT + 1
  const pill = (t: Label) => (
    <Pill key={t.id} color={t.color} active={picked.includes(t.id)} onClick={() => onToggle(t.id)}>
      #{t.name}
    </Pill>
  )

  /** Set when the search folds away, so focus lands on "N more" rather than the page. */
  const refocusMore = useRef(false)
  useEffect(() => {
    if (expanded) findRef.current?.focus()
    else if (refocusMore.current) moreRef.current?.focus()
    refocusMore.current = false
  }, [expanded])
  const collapse = () => {
    refocusMore.current = true
    setExpanded(false)
    setQuery('')
  }

  if (!folds) return <Cluster label="Tags">{tags.map(pill)}</Cluster>

  if (!expanded) {
    const shown = [...tags.filter((t) => picked.includes(t.id)), ...tags.filter((t) => !picked.includes(t.id))].slice(
      0,
      Math.max(TAG_LIMIT, picked.length),
    )
    const order = new Set(shown.map((t) => t.id))
    const rest = tags.length - shown.length
    return (
      <Cluster label="Tags">
        {tags.filter((t) => order.has(t.id)).map(pill)}
        {rest > 0 && (
        <button
          ref={moreRef}
          type="button"
          data-tags-more
          aria-expanded={false}
          onClick={() => setExpanded(true)}
          className={`${pillClass} text-fg ${hoverHighlight}`}
        >
          {rest} more
          <span className="sr-only"> tags</span>
        </button>
        )}
      </Cluster>
    )
  }

  const q = query.trim().toLowerCase().replace(/^#/, '')
  const matches = q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags
  return (
    <Cluster label="Tags">
      <div className="relative w-full sm:w-56">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={findRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            e.stopPropagation()
            collapse()
          }}
          placeholder="Find a tag…"
          aria-label="Find a tag"
          className={`${select} h-8 pl-8 [&::-webkit-search-cancel-button]:hidden`}
        />
      </div>
      {matches.map(pill)}
      {matches.length === 0 && (
        <p role="status" className="text-xs text-muted">
          No tag matches “{query.trim()}”.
        </p>
      )}
      <button
        type="button"
        aria-expanded
        onClick={collapse}
        className={`${pillClass} text-fg ${hoverHighlight}`}
      >
        Fewer tags
      </button>
    </Cluster>
  )
}

/** Room to leave under the open panel for the list: its count line and about one and a half cards. */
const LIST_PEEK = 240
/** How close to the top of the screen the scroll may bring the bar. */
const TOP_GAP = 12

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
export function FilterBar({ filters: f, onFilters, sort, onSort, group, onGroup, projects, tags, doneCount, listEmpty = false }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const barRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  /** Set by the toggle's click, so only opening it by hand scrolls, never a re-render. */
  const justOpened = useRef(false)
  const reduce = useReducedMotionConfig()
  const chipRowRef = useRef<HTMLDivElement>(null)
  /** Where focus goes once a chip or Clear filters has gone: the chip now at that index, or the toggle. */
  const refocus = useRef<number | 'toggle' | null>(null)

  const set = (patch: Partial<Filters>) => onFilters({ ...f, ...patch })
  const chips = filterChips(f, projects, tags)

  // Removing a chip unmounts the button that had focus. Hand focus to the chip that took its place,
  // or the one before it, never to Clear filters (a second Enter would wipe the rest). Once no chip
  // is left: Clear filters if a search still filters, else the Filters button.
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

  // On a short screen (a phone) the open panel can push the whole list below the fold, so a pick
  // would change something out of sight. Scroll just enough to show the list's start under the
  // panel, never lifting the bar past the top of the screen; where the list already shows, nothing moves.
  useLayoutEffect(() => {
    if (!open || !justOpened.current) return
    justOpened.current = false
    const bar = barRef.current?.getBoundingClientRect()
    if (!bar) return
    const by = Math.min(bar.top - TOP_GAP, bar.bottom + LIST_PEEK - window.innerHeight)
    if (by > 0) window.scrollBy({ top: by, behavior: reduce ? 'instant' : 'smooth' })
  }, [open, reduce])

  const clear = () => {
    refocus.current = 'toggle'
    onFilters({ ...EMPTY_FILTERS, showCompleted: f.showCompleted })
  }
  // Not for a picked tile alone: the tile shows the pick and unpicks itself, so a lone Clear filters
  // would only repeat it. With a search or a chip it clears the tile too.
  const clearButton = !listEmpty && Boolean(f.query.trim() || chips.length) && (
    <button type="button" data-clear onClick={clear} className={`${pillClass} text-fg ${hoverHighlight}`}>
      Clear filters
    </button>
  )

  return (
    <div ref={barRef} data-filter-bar className={`${card} p-3 sm:p-4`}>
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
          onClick={() => {
            justOpened.current = !open
            setOpen(!open)
          }}
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

      {!open && (chips.length > 0 || clearButton || sort !== 'smart') && (
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
          {/* Not a filter (it narrows nothing, Clear filters leaves it, the badge doesn't count it), so it
              comes after the filters, in a plain Well Stone well: a note on why the order looks as it does. */}
          {sort !== 'smart' && (
            <button
              type="button"
              data-sort-chip
              onClick={() => {
                // Focus then goes to the last filter chip, else Clear filters, else the Filters button.
                refocus.current = chips.length
                onSort('smart')
              }}
              aria-label={`Sorted by ${SORT_LABEL[sort]}. Sort by Smart instead`}
              title="Sort by Smart instead"
              className={`${pillClass} bg-subtle pr-2.5 font-medium text-fg/80 hover:shadow-pop`}
            >
              <ArrowDownUp className="size-3.5 opacity-75" aria-hidden />
              Sorted by {SORT_LABEL[sort]}
              <X className="size-3.5 opacity-75" aria-hidden />
            </button>
          )}
          {clearButton}
        </div>
      )}

      {/* Always in the DOM so the toggle's aria-controls points at something; filled only while open. */}
      <div id={panelId} hidden={!open}>
        {open && (
          // Show above Arrange; from lg, Arrange is a narrow column beside Show, so the panel stays short.
          <Reveal className="mt-4 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start lg:gap-8">
            <Section title="Show">
              {/* Stacked on phones (each name in its own column); from sm, side by side and wrapping, 16px apart. */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-4">
                <Field label="Project" className="sm:w-48">
                  <select aria-label="Filter by project" value={f.projectId ?? ''} onChange={(e) => set({ projectId: e.target.value || undefined })} className={select}>
                    <option value="">All projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value={NO_PROJECT}>No project</option>
                  </select>
                </Field>
                <Cluster label="Priority">
                  {PRIORITIES.map((p) => (
                    <Pill key={p} activeTone={PRIORITY_TONE[p].pressed} active={f.priorities.includes(p)} onClick={() => set({ priorities: toggle(f.priorities, p) })}>
                      <PriorityGlyph priority={p} />
                      {PRIORITY_LABEL[p]}
                    </Pill>
                  ))}
                </Cluster>
                <Cluster label="Status">
                  {OPEN_STATUSES.map((s) => (
                    <Pill key={s} activeTone={STATUS_PANEL[s]} active={f.statuses.includes(s)} onClick={() => set({ statuses: toggle(f.statuses, s) })}>
                      {STATUS_LABEL[s]}
                    </Pill>
                  ))}
                </Cluster>
                {tags.length > 0 && <TagCluster tags={tags} picked={f.tagIds} onToggle={(id) => set({ tagIds: toggle(f.tagIds, id) })} />}
              </div>

              <div className="flex min-h-8 items-center justify-between gap-3 text-sm text-muted">
                <label className="flex items-center gap-2 font-medium tabular-nums">
                  {/* Ticked whenever done tasks list, including while the Completed tile is picked (see showsCompleted). */}
                  <input type="checkbox" checked={showsCompleted(f)} onChange={(e) => onFilters(withShowCompleted(f, e.target.checked))} className="box-check" />
                  Show completed ({doneCount})
                </label>
                {clearButton}
              </div>
            </Section>

            <Section title="Arrange">
              <div className="grid grid-cols-2 gap-x-2 sm:max-w-md">
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
            </Section>
          </Reveal>
        )}
      </div>
    </div>
  )
}
