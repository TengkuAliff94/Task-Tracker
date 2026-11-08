import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { btn } from '../ui'

/** Asks for notification permission. Hidden once granted or when the browser has no support. */
export function NotificationButton() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')

  if (!supported || permission === 'granted') return null

  if (permission === 'denied') {
    return (
      <span className={`${btn.icon} cursor-help`} title="Notifications are blocked. Allow them for this site in your browser settings.">
        <BellOff className="size-5" aria-label="Notifications blocked" />
      </span>
    )
  }

  return (
    <button onClick={async () => setPermission(await Notification.requestPermission())} className={btn.secondary}>
      <Bell className="size-4" /> <span className="hidden sm:inline">Enable notifications</span>
    </button>
  )
}
