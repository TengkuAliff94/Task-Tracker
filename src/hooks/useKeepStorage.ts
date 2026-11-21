import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { persistence } from '../db/persistence'
import { usage } from '../db/usage'

/**
 * Asks the browser to keep the app's storage once there's something worth keeping: straight after the
 * person's first own task (or first restore) in this visit, when a prompt makes sense, and on later
 * launches only if the browser would grant it without a prompt. The result shows in Backup & restore.
 */
export function useKeepStorage() {
  const firstUse = useLiveQuery(async () => ({ at: await usage.firstUsedAt() }), [])
  const previous = useRef<{ at?: number }>(undefined)

  useEffect(() => {
    if (!firstUse) return
    const before = previous.current
    previous.current = firstUse
    if (firstUse.at === undefined) return
    // Undefined on an earlier reading in this visit, so the person has just started using the app.
    void persistence.keep({ firstUse: before !== undefined && before.at === undefined })
  }, [firstUse])
}
