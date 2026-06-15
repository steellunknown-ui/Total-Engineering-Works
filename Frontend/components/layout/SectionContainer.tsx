import { cn } from '@/utils/cn'

interface SectionContainerProps {
  children: React.ReactNode
  className?: string
  background?: 'base' | 'surface' | 'section-alt' | 'void' | 'none'
  /** Vertical padding variant */
  spacing?: 'default' | 'compact' | 'none'
  /** HTML id for anchor navigation */
  id?: string
  /** HTML tag */
  as?: 'section' | 'div' | 'article'
}

/**
 * SectionContainer — controls layout rhythm for the entire site.
 * Every page section must use this. Never apply section padding manually.
 *
 * Enforces:
 * - max-width 1280px container
 * - responsive horizontal padding
 * - consistent vertical section spacing
 * - background variants from design system
 *
 * (Wait, fixing the map below too)
 */
export function SectionContainer({
  children,
  className,
  background = 'none',
  spacing = 'default',
  id,
  as: Tag = 'section',
}: SectionContainerProps) {
  const bgMap = {
    base:          'bg-bg-base',
    surface:       'bg-bg-surface',
    'section-alt': 'bg-bg-section-alt',
    void:          'bg-bg-void',
    none:          '',
  }

  const spacingMap = {
    default: 'py-section',
    compact: 'py-section-sm',
    none:    '',
  }

  return (
    <Tag
      id={id}
      className={cn(bgMap[background], className)}
    >
      <div
        className={cn(
          'mx-auto w-full max-w-container',
          'px-6 md:px-10 xl:px-container-x',
          spacingMap[spacing]
        )}
      >
        {children}
      </div>
    </Tag>
  )
}
