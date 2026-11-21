import { useId, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { btn } from '../ui'

/** Asks for notification permission, from the header's button panel. Hidden once granted or when the browser has no support. */
export function NotificationButton() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')
  const tipId = useId()

  if (!supported || permission === 'granted') return null

  if (permission === 'denied') {
    // A real button, so keyboard and touch can reach the explanation, not only a hover tooltip. It opens
    // a popover (Esc or a tap elsewhere closes it); a screen reader also hears the text as its description.
    return (
      <>
        <button
          type="button"
          popoverTarget={tipId}
          aria-label="Notifications blocked"
          aria-describedby={`${tipId}-text`}
          className={btn.headerIcon}
        >
          <BellOff className="size-5" aria-hidden />
        </button>
        <div
          id={tipId}
          popover="auto"
          className="inset-auto top-23 right-4 m-0 max-w-[min(20rem,calc(100vw-2rem))] animate-fade-up rounded-panel border-0 bg-raised p-4 text-sm text-fg shadow-pop"
        >
          <p id={`${tipId}-text`}>
            Notifications are blocked, so reminders only show inside the app. To get them as notifications, allow them for
            this site in your browser’s settings.
          </p>
        </div>
      </>
    )
  }

  return (
    <button onClick={async () => setPermission(await Notification.requestPermission())} className={`${btn.headerIcon} sm:w-auto sm:px-2.5`}>
      <Bell className="size-4" /> <span className="hidden sm:inline">Enable notifications</span>
    </button>
  )
}
