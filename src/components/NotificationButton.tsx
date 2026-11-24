import { useEffect, useId, useRef, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { cn } from '../lib/utils'
import { btn } from '../ui'
import { placeBelow } from './Menu'

/** Phones get the smaller tile; from lg the button carries its words too. */
const BUTTON = cn(btn.headerIcon, 'max-sm:size-8 lg:w-auto lg:px-2.5')

/** Asks for notification permission, from the header's button panel. Hidden once granted or when the browser has no support. */
export function NotificationButton() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')
  const tipId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  // The explanation opens right under the button, wherever the header puts it.
  useEffect(() => {
    const tip = tipRef.current
    if (!tip) return
    const place = () => buttonRef.current && placeBelow(buttonRef.current, tip)
    tip.addEventListener('beforetoggle', place)
    return () => tip.removeEventListener('beforetoggle', place)
  }, [permission])

  if (!supported || permission === 'granted') return null

  if (permission === 'denied') {
    // A real button, so keyboard and touch can reach the explanation, not only a hover tooltip. It opens
    // a popover (Esc or a tap elsewhere closes it); a screen reader also hears the text as its description.
    return (
      <>
        <button
          ref={buttonRef}
          type="button"
          popoverTarget={tipId}
          aria-label="Notifications blocked"
          aria-describedby={`${tipId}-text`}
          className={BUTTON}
        >
          <BellOff className="size-5" aria-hidden /> <span className="max-lg:hidden">Notifications blocked</span>
        </button>
        <div
          ref={tipRef}
          id={tipId}
          popover="auto"
          className="inset-auto m-0 max-w-[min(20rem,calc(100vw-2rem))] animate-fade-up rounded-panel border-0 bg-raised p-4 text-sm text-fg shadow-pop"
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
    <button onClick={async () => setPermission(await Notification.requestPermission())} className={BUTTON}>
      <Bell className="size-5" aria-hidden /> <span className="max-lg:hidden">Enable notifications</span>
    </button>
  )
}
