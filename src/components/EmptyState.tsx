import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** A friendly placeholder for an empty list. */
export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="animate-fade-up rounded-xl border border-dashed border-line-strong bg-surface/50 px-6 py-12 text-center">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-surface text-primary shadow-card">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>
    </div>
  )
}
