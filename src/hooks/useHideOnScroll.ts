import { useEffect, useState, type RefObject } from 'react'
import { nextHeaderVisibility } from '../lib/headerScroll'

/** True while the page is being scrolled down past `ref`'s element; false scrolling up or near the top. */
export function useHideOnScroll(ref: RefObject<HTMLElement | null>): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let state = { anchorY: window.scrollY, hidden: false }
    const onScroll = () => {
      state = nextHeaderVisibility({ ...state, y: window.scrollY, topZone: ref.current?.offsetHeight ?? 0 })
      setHidden(state.hidden)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ref])

  return hidden
}
