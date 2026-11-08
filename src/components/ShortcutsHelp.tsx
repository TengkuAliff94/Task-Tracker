import { SHORTCUTS } from '../hooks/useShortcuts'
import { Dialog } from './Dialog'

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose} width="max-w-sm">
      <dl className="space-y-2 text-sm">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between gap-4">
            <dt>{s.label}</dt>
            <dd>
              <kbd className="rounded border border-line-strong bg-subtle px-1.5 py-0.5 font-mono text-xs">{s.keys}</kbd>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted">Shortcuts are off while you type in a field or a window is open.</p>
    </Dialog>
  )
}
