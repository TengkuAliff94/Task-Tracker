import { Fragment } from 'react'
import { QUICK_ADD_SYNTAX } from '../lib/quickAdd'

/** A token as you'd type it: a small Well Stone chip, like the preview's, that never breaks mid-token. */
export function Token({ children }: { children: string }) {
  return <span className="rounded-md bg-subtle px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-fg">{children}</span>
}

/** "!low, !med or !urgent", with each token kept whole. */
function alternatives(tokens: string[]) {
  return tokens.map((token, i) => (
    <Fragment key={token}>
      {i > 0 && (i === tokens.length - 1 ? ' or ' : ', ')}
      <span className="font-medium whitespace-nowrap text-fg">{token}</span>
    </Fragment>
  ))
}

/**
 * The quick-add reference: each kind of token, what it sets, and the other forms it takes. Shared
 * by the quick-add bar's help popover and the keyboard shortcuts sheet, so the two never differ.
 */
export function QuickAddSyntax() {
  return (
    <div className="text-sm">
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2.5">
        {QUICK_ADD_SYNTAX.map(({ name, tokens: [first, ...rest], note }) => (
          <Fragment key={name}>
            <dt>
              <Token>{first}</Token>
            </dt>
            <dd className="text-muted">
              <span className="font-semibold text-fg">{name}.</span>
              {rest.length > 0 && <> Also {alternatives(rest)}.</>}
              {note && <> {note}</>}
            </dd>
          </Fragment>
        ))}
      </dl>
      <p className="mt-3 text-muted">The rest of the line is the title.</p>
    </div>
  )
}
