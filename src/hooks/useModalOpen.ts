import { useSyncExternalStore } from 'react'

/** True while a native <dialog> is open as a modal (it makes the rest of the page inert). */
function anyModalOpen(): boolean {
  try {
    return document.querySelector('dialog:modal') !== null
  } catch {
    return document.querySelector('dialog[open]') !== null // browsers without :modal
  }
}

function subscribe(onChange: () => void) {
  // showModal() and close() toggle the `open` attribute, and dialogs mount and unmount with their owners.
  const observer = new MutationObserver(onChange)
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] })
  return () => observer.disconnect()
}

/**
 * Whether a modal dialog is open right now. Anything outside it can't be reached until it closes,
 * so timers on that content (a toast's countdown) should wait.
 */
export function useModalOpen(): boolean {
  return useSyncExternalStore(subscribe, anyModalOpen, () => false)
}
