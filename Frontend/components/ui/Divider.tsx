import { cn } from '@/utils/cn'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
  /** Visual weight */
  weight?: 'hairline' | 'default'
}

/**
 * Divider — structural separator using design system border colors.
 * Use for separating stats, footer columns, form groups.
 * Never use ad-hoc border classes for separators.
 */
export function Divider({
  orientation = 'horizontal',
  className,
  weight = 'hairline',
}: DividerProps) {
  const colorClass = weight === 'hairline' ? 'border-border-hairline' : 'border-border-default'

  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('w-px self-stretch', colorClass.replace('border-', 'bg-'), className)}
      />
    )
  }

  return (
    <hr
      role="separator"
      className={cn('w-full border-0 border-t', colorClass, className)}
    />
  )
}
