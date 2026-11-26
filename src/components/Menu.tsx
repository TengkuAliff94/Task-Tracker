import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

/** One line in a menu: an action, or a labelled set of choices where one is picked (the theme). */
export type MenuEntry =
  | { kind: 'action'; label: string; icon: LucideIcon; onSelect: () => void; /** A key that does the same from the list, shown at the end where there's a keyboard. */ hint?: string }
  | {
      kind: 'choice'
      label: string
      value: string
      options: readonly { value: string; label: string; icon: LucideIcon }[]
      onChoose: (value: string) => void
    }

interface Props {
  /** The button's accessible name, and the menu's. */
  label: string
  title?: string
  triggerClassName: string
  /** What the button shows. */
  children: ReactNode
  entries: MenuEntry[]
}

/**
 * Puts a top-layer popover just under `anchor`, lined up with its right edge (16px from the screen
 * edge at least). The popover is `position: fixed`, so this is viewport space.
 */
export function placeBelow(anchor: HTMLElement, popover: HTMLElement): void {
  const box = anchor.getBoundingClientRect()
  popover.style.top = `${box.bottom + 8}px`
  popover.style.right = `${Math.max(16, document.documentElement.clientWidth - box.right)}px`
}

const ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-fg transition-colors duration-200 hover:bg-panel-mustard hover:text-on-panel-mustard'

/**
 * A menu button (WAI-ARIA menu pattern) on the popover API: Esc and a tap elsewhere close it, and the
 * shortcuts stand aside while it's open. Opening focuses the picked choice, else the first item; the
 * arrow keys, Home and End move through the items, and Tab closes it. Choosing puts focus back on the
 * button before acting, so a dialog opened from the menu returns focus there when it closes.
 */
export function Menu({ label, title, triggerClassName, children, entries }: Props) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const place = () => triggerRef.current && placeBelow(triggerRef.current, menu)
    const onBeforeToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === 'open') place()
    }
    const onToggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === 'open'
      setOpen(isOpen)
      if (isOpen) {
        const picked = menu.querySelector<HTMLElement>('[aria-checked="true"]')
        ;(picked ?? menu.querySelector<HTMLElement>('[role^="menuitem"]'))?.focus()
        // Scrolling can't move the button: the sticky header stays shown while focus is inside it
        // (`.hide-on-scroll:focus-within`), and the menu is part of the header. Resizing can.
        window.addEventListener('resize', place)
      } else {
        window.removeEventListener('resize', place)
        // Esc returns focus to the button by itself; a menu closed with focus inside it would drop it to the page.
        const active = document.activeElement
        if (!active || active === document.body || menu.contains(active)) triggerRef.current?.focus()
      }
    }
    menu.addEventListener('beforetoggle', onBeforeToggle)
    menu.addEventListener('toggle', onToggle)
    return () => {
      menu.removeEventListener('beforetoggle', onBeforeToggle)
      menu.removeEventListener('toggle', onToggle)
      window.removeEventListener('resize', place)
    }
  }, [])

  const choose = (act: () => void) => {
    menuRef.current?.hidePopover()
    triggerRef.current?.focus()
    act()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])
    const at = items.indexOf(document.activeElement as HTMLElement)
    const go = (i: number) => {
      e.preventDefault()
      items[(i + items.length) % items.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else if (e.key === 'Tab') {
      e.preventDefault()
      menuRef.current?.hidePopover()
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={id}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={title}
        // Lit while its menu is open, as Trash is while pressed.
        className={cn(triggerClassName, 'aria-expanded:bg-panel-mustard aria-expanded:text-on-panel-mustard')}
      >
        {children}
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="inset-auto m-0 w-56 max-w-[calc(100vw-2rem)] animate-fade-up rounded-panel border-0 bg-raised p-1.5 text-fg shadow-pop"
      >
        {entries.map((entry) =>
          entry.kind === 'action' ? (
            <button
              key={entry.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => choose(entry.onSelect)}
              aria-keyshortcuts={entry.hint}
              className={ITEM}
            >
              <entry.icon className="size-4.5 shrink-0" aria-hidden />
              {entry.label}
              {entry.hint && (
                <kbd className="ms-auto touch:hidden" aria-hidden>
                  {entry.hint}
                </kbd>
              )}
            </button>
          ) : (
            <div key={entry.label} role="group" aria-labelledby={`${id}-${entry.label}`} className="not-first:mt-1.5">
              <p id={`${id}-${entry.label}`} className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted">
                {entry.label}
              </p>
              {entry.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option.value === entry.value}
                  tabIndex={-1}
                  onClick={() => choose(() => entry.onChoose(option.value))}
                  className={ITEM}
                >
                  <option.icon className="size-4.5 shrink-0" aria-hidden />
                  {option.label}
                  {option.value === entry.value && <Check className="ml-auto size-4 shrink-0" strokeWidth={2.5} aria-hidden />}
                </button>
              ))}
            </div>
          ),
        )}
      </div>
    </>
  )
}
