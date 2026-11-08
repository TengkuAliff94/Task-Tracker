// Shared class strings so every component uses the same tokens.

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'

export const btn = {
  primary: `${btnBase} bg-primary px-3.5 py-2 text-on-primary shadow-primary hover:bg-primary-hover active:translate-y-px`,
  secondary: `${btnBase} border border-line-strong bg-surface px-3 py-2 shadow-xs hover:border-muted/40 hover:bg-hover`,
  ghost: `${btnBase} px-3 py-2 text-muted hover:bg-subtle hover:text-fg`,
  danger: `${btnBase} px-3 py-2 text-danger hover:bg-danger/10`,
  small: `${btnBase} rounded-md px-2 py-1 text-xs hover:bg-surface hover:shadow-xs`,
  icon: `${btnBase} size-9 shrink-0 text-muted hover:bg-subtle hover:text-fg`,
}

export const field =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-fg shadow-xs transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 hover:border-muted/40 focus:border-ring focus:shadow-[0_0_0_3px_var(--primary-soft)] focus:outline-none disabled:opacity-50'

export const card = 'rounded-xl border border-line bg-surface shadow-card'

export const dialog =
  'm-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-line bg-raised p-0 text-fg shadow-modal'

export const labelText = 'text-[13px] font-medium text-fg/90'
