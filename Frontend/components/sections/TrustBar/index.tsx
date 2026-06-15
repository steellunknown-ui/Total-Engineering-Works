import { clients } from '@/config/clients'
import { SectionContainer } from '@/components/layout/SectionContainer'

/**
 * TrustBar — immediate authority strip directly below the hero.
 * Renders client logos in grayscale. No text captions needed.
 * The logos speak for themselves.
 *
 * Server Component — pure static HTML. No interactivity.
 *
 * Placement: Section 2 (immediately after Hero, before Stats).
 * Purpose: eliminate doubt before the visitor scrolls deeper.
 */
export function TrustBar() {
  return (
    <SectionContainer
      background="section-alt"
      spacing="compact"
      id="trust-bar"
      className="border-y border-border-hairline"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Label */}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted text-center">
          Trusted by Global Industrial Leaders
        </p>

        {/* Client Names — text-based until real SVG logos are sourced */}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:gap-x-14">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-center"
              title={client.name}
            >
              {/* Logo placeholder — replace with next/image when SVGs are available */}
              <span
                className={[
                  'font-sans font-semibold text-[15px] tracking-[0.04em]',
                  'text-text-muted hover:text-text-secondary',
                  'transition-colors duration-200',
                  'select-none uppercase',
                ].join(' ')}
                aria-label={client.name}
              >
                {client.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
