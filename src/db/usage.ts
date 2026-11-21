// When the person started using the app for real. Sample data back-dates its tasks, so their
// `createdAt` values say nothing about how long someone has relied on the app; this does.
import { createMetaStore, db as defaultDb, FIRST_USED_KEY, type TaskTrackerDB } from './db'

export function createUsage(db: TaskTrackerDB = defaultDb) {
  const meta = createMetaStore(db)
  return {
    /** When the person first added a task of their own or restored a backup. Undefined until then. */
    firstUsedAt: () => meta.get<number>(FIRST_USED_KEY),

    /** Records real use. Only the first call counts; later ones leave the time alone. */
    noteUse(now = Date.now()): Promise<void> {
      return db.transaction('rw', db.meta, async () => {
        if ((await meta.get(FIRST_USED_KEY)) === undefined) await meta.set(FIRST_USED_KEY, now)
      })
    },
  }
}

export const usage = createUsage()
