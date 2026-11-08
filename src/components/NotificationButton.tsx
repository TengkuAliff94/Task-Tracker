import { useState } from 'react'

/** Asks for notification permission. Hidden once granted or when the browser has no support. */
export function NotificationButton() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')

  if (!supported || permission === 'granted') return null

  if (permission === 'denied') {
    return (
      <span className="self-center text-xs text-slate-500" title="Allow notifications for this site in your browser settings">
        Notifications blocked
      </span>
    )
  }

  return (
    <button
      onClick={async () => setPermission(await Notification.requestPermission())}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      🔔 Enable notifications
    </button>
  )
}
