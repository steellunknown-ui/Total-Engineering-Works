import { cn } from '@/utils/cn'

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
  /** Color tone for the label */
  tone?: 'steel' | 'muted' | 'primary'
}

/**
 * SectionLabel — the eyebrow text above section headings.
 * Always uppercase, always tracked, always consistent.
 *
 * Used above every major section heading:
 * "CAPABILITIES" / "INFRASTRUCTURE" / "TRUSTED BY" etc.
 *
 * Never style this inline. Never create a second label component.
 */
export function SectionLabel({ children, className, tone = 'steel' }: SectionLabelProps) {
  const toneClasses = {
    steel:   'text-accent-steel',
    muted:   'text-text-muted',
    primary: 'text-accent-primary',
  }

  return (
    <p
      className={cn(
        'font-sans text-label font-semibold uppercase tracking-[0.12em]',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </p>
  )
}
