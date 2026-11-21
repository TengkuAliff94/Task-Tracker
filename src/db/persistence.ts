// Asks the browser to keep this site's storage when the device runs low on space. Without that,
// a browser may clear IndexedDB on its own (Safari is strict with sites that aren't installed).
// Chrome and Edge decide silently; Firefox asks the person.

/** `protected`: the browser won't clear it to free space. `unknown`: this browser doesn't say. */
export type StorageProtection = 'protected' | 'unprotected' | 'unknown'

function manager(): StorageManager | undefined {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage
  return typeof storage?.persisted === 'function' && typeof storage.persist === 'function' ? storage : undefined
}

/** True when the browser would grant protection without showing anyone a prompt. */
async function grantedWithoutPrompt(): Promise<boolean> {
  try {
    const state = await navigator.permissions?.query({ name: 'persistent-storage' as PermissionName })
    return state?.state === 'granted'
  } catch {
    return false // a browser that doesn't know the permission name throws
  }
}

const listeners = new Set<(status: StorageProtection) => void>()

export const persistence = {
  /** Calls `listener` with every request's answer, wherever it was asked from. Returns an unsubscribe. */
  subscribe(listener: (status: StorageProtection) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  async status(): Promise<StorageProtection> {
    const storage = manager()
    if (!storage) return 'unknown'
    try {
      return (await storage.persisted()) ? 'protected' : 'unprotected'
    } catch {
      return 'unknown'
    }
  },

  /** Asks for protection. Firefox may show a prompt, so only call this when the person can see why. */
  async request(): Promise<StorageProtection> {
    const storage = manager()
    let result: StorageProtection = 'unknown'
    if (storage) {
      try {
        result = (await storage.persist()) ? 'protected' : 'unprotected'
      } catch {
        result = 'unknown'
      }
    }
    for (const listener of listeners) listener(result)
    return result
  },

  /**
   * Protects storage when that can't interrupt anyone: right after the person's first own task
   * (`firstUse`), or whenever the browser would grant it without a prompt, e.g. once the app is installed.
   * Never prompts on page load.
   */
  async keep({ firstUse }: { firstUse: boolean }): Promise<void> {
    if ((await this.status()) !== 'unprotected') return
    if (firstUse || (await grantedWithoutPrompt())) await this.request()
  },
}
