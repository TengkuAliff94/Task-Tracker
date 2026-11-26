import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { LABEL_COLOR_NAMES, LABEL_COLORS } from '../lib/colors'

/**
 * A project or tag's colour: the round swatch opens a small popover of the calm palette, so a label
 * can't be given a colour that already has a job (red for late, the brand orange, mustard, violet).
 * The choices are a radio group (arrow keys move and pick, as in any radio group); Enter, Space or a
 * click on one picks it and closes the popover. Esc or a tap elsewhere closes it unchanged.
 */
export function ColorPicker({ name, color, onPick }: { name: string; color: string; onPick: (color: string) => void }) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const current = LABEL_COLORS.includes(color) ? color : undefined

  // Hangs under the swatch, lined up with its left edge, or above it when there's no room below; it
  // focuses the colour in use (or the first) and closes once focus leaves it, so it never covers the
  // control Tab moves on to (WCAG 2.4.11).
  useEffect(() => {
    const pop = popRef.current
    if (!pop) return
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== 'open' || !triggerRef.current) return
      const box = triggerRef.current.getBoundingClientRect()
      const { offsetHeight: h, offsetWidth: w } = pop
      const below = box.bottom + 8
      pop.style.top = `${below + h > window.innerHeight - 16 ? Math.max(16, box.top - 8 - h) : below}px`
      pop.style.left = `${Math.max(16, Math.min(box.left, document.documentElement.clientWidth - w - 16))}px`
    }
    const closeOnLeave = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null
      if (to && !pop.contains(to) && pop.matches(':popover-open')) pop.hidePopover()
    }
    const focusChoice = (e: Event) => {
      if ((e as ToggleEvent).newState !== 'open') return
      place(e) // again, now that it has a size to flip by
      pop.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    }
    pop.addEventListener('beforetoggle', place)
    pop.addEventListener('toggle', focusChoice)
    pop.addEventListener('focusout', closeOnLeave)
    return () => {
      pop.removeEventListener('focusout', closeOnLeave)
      pop.removeEventListener('beforetoggle', place)
      pop.removeEventListener('toggle', focusChoice)
    }
  }, [])

  function pick(c: string) {
    if (c !== color) onPick(c)
    popRef.current?.hidePopover()
    triggerRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const at = LABEL_COLORS.indexOf((e.target as HTMLElement).dataset.color ?? '')
    const next = LABEL_COLORS[(at + step + LABEL_COLORS.length) % LABEL_COLORS.length]
    onPick(next)
    popRef.current?.querySelector<HTMLElement>(`[data-color="${next}"]`)?.focus()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={id}
        aria-label={`Color for ${name}`}
        title={LABEL_COLOR_NAMES[color] ?? 'Custom colour'}
        className="swatch"
        style={{ backgroundColor: color }}
      />
      <div
        ref={popRef}
        id={id}
        popover="auto"
        role="radiogroup"
        aria-label={`Color for ${name}`}
        onKeyDown={onKeyDown}
        className="inset-auto m-0 animate-fade-up rounded-panel border-0 bg-raised p-3 shadow-pop"
      >
        <div className="grid grid-cols-4 gap-2">
          {LABEL_COLORS.map((c, i) => {
            const checked = c === current
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={LABEL_COLOR_NAMES[c]}
                title={LABEL_COLOR_NAMES[c]}
                data-color={c}
                tabIndex={checked || (!current && i === 0) ? 0 : -1}
                onClick={() => pick(c)}
                // The pick has a check (dark ink reads on every palette colour) and an inner ring in the
                // popover's colour; the outline stays focus's alone.
                className="swatch grid place-items-center"
                style={{ backgroundColor: c, ...(checked && { boxShadow: 'inset 0 0 0 3px var(--raised)' }) }}
              >
                {checked && <Check className="size-4 text-on-panel-sage" strokeWidth={3} aria-hidden />}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
