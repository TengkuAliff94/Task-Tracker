import { useId, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { card, panel } from '../ui'
import { Reveal } from './motion/Reveal'

interface Props {
  icon: LucideIcon
  title: string
  children: ReactNode
  /** The way out of the empty state, shown prominently under the text (e.g. "Load sample data"). */
  action?: ReactNode
}

/**
 * A friendly placeholder for an empty list: a big panel (a region named by its title) whose icon
 * tile floats gently up and down (decoration only; it keeps still under reduced motion).
 */
export function EmptyState({ icon: Icon, title, children, action }: Props) {
  const titleId = useId()
  return (
    <Reveal>
      <section aria-labelledby={titleId} className={`${card} px-6 py-14 text-center sm:py-20`}>
        <span className={`mx-auto mb-6 grid size-16 place-items-center rounded-2xl motion-safe:animate-float ${panel.brand}`}>
          <Icon className="size-8" aria-hidden />
        </span>
        <h2 id={titleId} className="text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{children}</p>
        {action && <div className="mt-7 flex justify-center">{action}</div>}
      </section>
    </Reveal>
  )
}
