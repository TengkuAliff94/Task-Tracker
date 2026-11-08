import { createMetaStore, db as defaultDb, type TaskTrackerDB } from './db'

const CHECKED_UP_TO_KEY = 'remindersCheckedAt'

/**
 * Remembers how far reminders have been checked, so reminders that went off while the app
 * was closed can be reported as missed on the next launch.
 */
export function createReminderLog(db: TaskTrackerDB = defaultDb) {
  const meta = createMetaStore(db)
  return {
    /** Undefined until the first check ever. */
    checkedUpTo: () => meta.get<number>(CHECKED_UP_TO_KEY),
    markChecked: (at: number) => meta.set(CHECKED_UP_TO_KEY, at),
  }
}

export const reminderLog = createReminderLog()
