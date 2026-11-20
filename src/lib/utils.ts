import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names, letting later Tailwind classes override earlier ones. Registry components import this. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** What went wrong while saving, in words the person can act on. */
export function describeSaveError(err: unknown): string {
  const named = err as { name?: string; inner?: { name?: string } } | null
  if (named?.name === 'QuotaExceededError' || named?.inner?.name === 'QuotaExceededError') {
    return 'There isn’t enough storage space on this device to save this. Remove a large attachment or free up some space, then try again.'
  }
  return err instanceof Error ? err.message : String(err)
}
