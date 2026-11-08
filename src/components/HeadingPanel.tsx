import { panel } from '../ui'
import { RISE_FROM } from './motion/presets'
import { Reveal } from './motion/Reveal'

/**
 * The big "Tasks" heading with today's date, on a brand-coloured panel. A black sun (after Sill's)
 * rises into the corner on load; it's decoration only and sits clear of the text.
 */
export function HeadingPanel({ dateLabel }: { dateLabel: string }) {
  return (
    <div className={`relative flex h-full min-h-40 flex-col justify-end overflow-hidden rounded-panel p-6 sm:p-7 ${panel.brand}`}>
      <Reveal from={RISE_FROM} index={2} className="absolute -top-10 -right-10 size-40 rounded-full bg-current sm:size-48" />
      <h1 className="relative text-5xl leading-[0.9] font-extrabold tracking-tight sm:text-6xl">Tasks</h1>
      <p className="relative mt-2 text-sm font-medium">{dateLabel}</p>
    </div>
  )
}
