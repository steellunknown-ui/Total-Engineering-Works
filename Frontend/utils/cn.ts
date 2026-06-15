import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes safely, resolving conflicts.
 * Use this for ALL conditional class logic in the project.
 * Never concatenate classes with string interpolation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
