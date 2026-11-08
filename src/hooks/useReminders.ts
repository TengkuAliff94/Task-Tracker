import { useCallback, useEffect, useRef, useState } from 'react'
import { reminderLog } from '../db/reminders'
import { dueReminders, notificationBody, type DueReminder } from '../lib/reminders'
import type { Task } from '../types'

const CHECK_EVERY_MS = 30_000

export interface Alert extends DueReminder {
  /** True if it went off while the app was closed. */
  missed: boolean
}

async function showSystemNotification({ task, reminder }: DueReminder): Promise<boolean> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  const options = { body: notificationBody(task), tag: reminder.id, icon: '/pwa-192x192.png' }
  try {
    const n = new Notification(task.title, options)
    n.onclick = () => window.focus()
    return true
  } catch {
    // Some mobile browsers only allow notifications from the service worker.
    const reg = await navigator.serviceWorker?.getRegistration()
    if (!reg) return false
    await reg.showNotification(task.title, options)
    return true
  }
}

/**
 * Watches reminders while the app is open. Uses a stored "checked up to" time so that, on the
 * next launch, reminders that went off while the app was closed show up as missed instead of
 * being lost or firing as a burst of notifications.
 */
export function useReminders(tasks: Task[] | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const loaded = tasks !== undefined

  const push = useCallback((found: Alert[]) => {
    if (!found.length) return
    setAlerts((prev) => {
      const seen = new Set(prev.map((a) => `${a.reminder.id}:${a.at}`))
      return [...prev, ...found.filter((a) => !seen.has(`${a.reminder.id}:${a.at}`))]
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    let cancelled = false

    async function check(isLaunch: boolean) {
      const current = tasksRef.current
      if (!current) return
      const now = Date.now()
      const since = await reminderLog.checkedUpTo()
      // Bail before moving the watermark, so a cancelled run (e.g. React StrictMode's
      // double mount) leaves the missed reminders for the next run to report.
      if (cancelled) return
      await reminderLog.markChecked(now)
      if (since === undefined) return // first run ever: nothing to catch up on

      const due = dueReminders(current, since, now)
      if (isLaunch) {
        push(due.map((d) => ({ ...d, missed: true })))
        return
      }
      const inApp: Alert[] = []
      for (const d of due) {
        if (!(await showSystemNotification(d))) inApp.push({ ...d, missed: false })
      }
      push(inApp)
    }

    check(true)
    const id = setInterval(() => check(false), CHECK_EVERY_MS)
    // Background tabs throttle timers, so check again as soon as the tab is visible.
    const onVisible = () => document.visibilityState === 'visible' && check(false)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loaded, push])

  const dismiss = useCallback((a: Alert) => setAlerts((prev) => prev.filter((x) => x !== a)), [])
  const dismissAll = useCallback(() => setAlerts([]), [])

  return { alerts, dismiss, dismissAll }
}
