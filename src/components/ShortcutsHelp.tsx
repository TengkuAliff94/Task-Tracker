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
              {/* The same key caps as everywhere else in the app; "J / K" is two keys. */}
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                {s.keys.split(' / ').map((key, i) => (
                  <span key={key} className="inline-flex items-center gap-1">
                    {i > 0 && <span aria-hidden>/</span>}
                    <kbd>{key}</kbd>
                  </span>
                ))}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted">Shortcuts are off while you type in a field or a window is open.</p>
    </Dialog>
  )
}
