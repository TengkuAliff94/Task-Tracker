import { useId, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { card, panel } from '../ui'
import { Reveal } from './motion/Reveal'

interface Props {
  icon: LucideIcon
  title: string
  children: ReactNode
  /** Something to try, right under the text and before the way out (the first-run quick-add example). */
  example?: ReactNode
  /** The way out of the empty state, shown prominently under the text (e.g. "Load sample data"). */
  action?: ReactNode
  /**
   * A quiet line right under the text (first run: where the data lives). It sits above the example
   * and the way out, so it's on the first screen at 1280×800 rather than under the fold.
   */
  note?: ReactNode
  /**
   * The icon tile's colour. Brand orange where the empty list is a welcome or good news; `quiet`
   * (taupe) where nothing matched, which is neither, so it doesn't greet a dead end in the brand colour.
   */
  tone?: 'brand' | 'quiet'
}

/**
 * A friendly placeholder for an empty list: a big panel (a region named by its title) whose icon
 * tile floats gently up and down (decoration only; it keeps still under reduced motion).
 */
export function EmptyState({ icon: Icon, title, children, example, action, note, tone = 'brand' }: Props) {
  const titleId = useId()
  return (
    <Reveal>
      <section aria-labelledby={titleId} tabIndex={-1} data-empty-state className={`${card} px-6 py-14 text-center sm:py-16`}>
        <span
          data-empty-tile={tone}
          className={`mx-auto mb-6 grid size-16 place-items-center rounded-2xl motion-safe:animate-float ${tone === 'quiet' ? panel.neutral : panel.brand}`}
        >
          <Icon className="size-8" aria-hidden />
        </span>
        <h2 id={titleId} className="text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-balance text-muted">{children}</p>
        {note && <p className="mx-auto mt-3 max-w-sm text-xs text-balance text-muted">{note}</p>}
        {example && <div className="mt-5 flex justify-center">{example}</div>}
        {action && <div className="mt-7 flex justify-center">{action}</div>}
      </section>
    </Reveal>
  )
}
