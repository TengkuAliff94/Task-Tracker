// Shared class strings so every component uses the same tokens.

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50'

export const btn = {
  primary: `${btnBase} bg-primary px-4 py-2 text-on-primary hover:bg-primary-hover`,
  secondary: `${btnBase} border border-line-strong px-3 py-2 hover:bg-subtle`,
  ghost: `${btnBase} px-3 py-2 hover:bg-subtle`,
  danger: `${btnBase} px-3 py-2 text-danger hover:bg-danger/10`,
  small: `${btnBase} rounded px-2 py-1 text-xs hover:bg-subtle`,
  icon: `${btnBase} size-9 shrink-0 text-muted hover:bg-subtle hover:text-fg`,
}

export const field =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-ring focus:outline-none disabled:opacity-50'

export const card = 'rounded-lg border border-line bg-surface'

export const dialog =
  'm-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl border border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/50'

export const labelText = 'text-sm font-medium'
