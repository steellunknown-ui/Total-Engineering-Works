import { cn } from '@/utils/cn'
import { SectionLabel } from './SectionLabel'

interface SectionHeadingProps {
  /** The H2 headline text */
  heading: React.ReactNode
  /** Optional eyebrow label above the heading */
  label?: string
  /** Optional supporting paragraph below the heading */
  subtitle?: React.ReactNode
  /** Show the vertical accent line to the left of the heading */
  accentLine?: boolean
  /** Text alignment */
  align?: 'left' | 'center'
  className?: string
}

/**
 * SectionHeading — defines every major section's visual identity.
 * H2 with optional label, accent line, and subtitle.
 *
 * The accent line (2px vertical, accent-primary color) is the design system's
 * structural signal that a new major topic has begun. Use it on primary sections.
 *
 * Never write ad-hoc H2 styles in section components. Use this.
 */
export function SectionHeading({
  heading,
  label,
  subtitle,
  accentLine = false,
  align = 'left',
  className,
}: SectionHeadingProps) {
  const alignClasses = align === 'center'
    ? 'items-center text-center mx-auto'
    : 'items-start text-left'

  return (
    <div className={cn('flex flex-col gap-4', alignClasses, className)}>
      {label && <SectionLabel>{label}</SectionLabel>}

      <div className={cn('flex gap-5', align === 'center' ? 'justify-center' : 'justify-start')}>
        {/* Vertical accent line — engineering drawing convention */}
        {accentLine && (
          <div className="hidden md:flex flex-shrink-0 items-start pt-2">
            <div className="w-0.5 h-10 bg-accent-primary rounded-full" />
          </div>
        )}

        <div className={cn('flex flex-col gap-4', align === 'center' ? 'items-center' : 'items-start')}>
          <h2
            className={cn(
              'font-sans font-semibold text-text-primary',
              'text-section-h-sm md:text-section-h-md lg:text-section-h',
              'max-w-headline leading-[1.06] tracking-[-0.03em]'
            )}
          >
            {heading}
          </h2>

          {subtitle && (
            <p
              className={cn(
                'font-sans text-body text-text-secondary',
                'max-w-reading leading-[1.70]',
                align === 'center' && 'text-center'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
