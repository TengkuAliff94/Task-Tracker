import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names, letting later Tailwind classes override earlier ones. Registry components import this. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
