import { clientAuthorityContent } from '@/config/clientAuthority'
import { SectionContainer }        from '@/components/layout/SectionContainer'
import { FadeIn }                  from '@/components/motion/FadeIn'
import { SlideInOut }              from '@/components/motion/SlideInOut'

import { GridBackground }         from '@/components/ui/GridBackground'

/**
 * ClientAuthority — Formal OEM relationship table.
 *
 * Midnight Engineering treatment:
 * - bg-section-alt (#0D0D0D) — barely-there tonal shift from pure black
 * - Client names at 24px-28px — large enough to feel institutional
 * - Hover reveals accent-primary underline on client name (Apple-style link)
 * - Ghost borders instead of hairline dividers
 * - NDA disclaimer in text-muted — legally mature, not apologetic
 *
 * Server Component — pure static HTML.
 */
export function ClientAuthority() {
  return (
    <SectionContainer
      background="none"
      spacing="default"
      id="clients"
      className="bg-bg-section-alt border-b border-border-hairline"
    >
      <FadeIn>

        {/* Section header — 2-column */}
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left — heading */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
              {clientAuthorityContent.sectionLabel}
            </p>
            <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em] whitespace-pre-line">
              {clientAuthorityContent.heading}
            </h2>
            <p className="font-sans text-body text-text-secondary max-w-[54ch] leading-[1.70] mt-1">
              {clientAuthorityContent.statement}
            </p>
          </div>

          {/* Right — sectors served + supply summary */}
          <div className="flex flex-col gap-6 lg:pt-2">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-steel">
                Sectors Served
              </p>
              <div className="flex flex-wrap gap-2">
                {['Telecom', 'Energy', 'Industrial Automation', 'Healthcare', 'Defense'].map((sector) => (
                  <span
                    key={sector}
                    className="font-mono text-[10px] uppercase tracking-[0.10em] text-text-secondary border border-border-hairline px-3 py-1.5"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* Supply relationship stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '25+',  label: 'Years of\nSupply'      },
                { value: '5',    label: 'Active\nSectors'       },
                { value: 'NDA',  label: 'Available\nImmediately' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5 border border-border-hairline p-4 bg-bg-surface/30">
                  <span className="font-mono font-semibold text-[22px] text-accent-primary leading-none tracking-[-0.02em]">
                    {item.value}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted leading-[1.5] whitespace-pre-line">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Client table — each row slides in from left, exits to right */}
        <div className="flex flex-col">
          {clientAuthorityContent.clients.map((client, index) => (
            <SlideInOut key={client.id} delay={index * 0.09}>
              <div
                className="
                  group border-t border-border-hairline last:border-b
                  py-8 md:py-10
                  grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 md:gap-16 items-start
                "
              >
                {/* Client name — left column */}
                <div className="flex flex-col gap-1.5">
                  <span className="
                    font-sans font-semibold
                    text-[20px] md:text-[24px]
                    text-text-primary
                    tracking-[-0.02em]
                    leading-none
                    group-hover:text-text-primary
                    transition-colors duration-200
                  ">
                    {client.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-steel mt-1">
                    {client.sector}
                  </span>
                </div>

                {/* Context — right column */}
                <p className="font-sans text-body text-text-secondary leading-[1.65]">
                  {client.context}
                </p>
              </div>
            </SlideInOut>
          ))}
        </div>

        {/* NDA disclaimer */}
        <div className="mt-12 pt-6 border-t border-border-hairline">
          <p className="font-mono text-[11px] text-text-muted tracking-[0.06em] max-w-[64ch] leading-[1.6]">
            {clientAuthorityContent.disclaimer}
          </p>
        </div>

      </FadeIn>
    </SectionContainer>
  )
}
