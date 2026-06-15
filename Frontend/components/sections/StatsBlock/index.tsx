import { stats } from '@/config/stats'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { cn } from '@/utils/cn'
import { GridBackground } from '@/components/ui/GridBackground'

/**
 * StatsBlock — Institutional authority metrics.
 *
 * Design: precision data readout on an active electrical grid.
 * The GridBackground creates a live circuit-board feel beneath the numbers.
 */
export function StatsBlock() {
  return (
    <SectionContainer
      background="base"
      spacing="default"
      id="stats"
      className="relative overflow-hidden border-b border-border-hairline"
    >
      {/* Dynamic Grid Background */}
      <GridBackground />
      {/* Content sits above grid on z-10 */}
      <div className="relative z-10">
        <FadeIn>
          {/* Header — 2-column: heading left, certifications right */}
          <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left — declaration */}
            <p className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
              The numbers that<br />govern every order.
            </p>

            {/* Right — certifications */}
            <div className="flex flex-col gap-3 lg:pt-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-steel mb-1">
                Quality Certifications
              </p>
              {[
                { code: 'ISO 9001:2015',  name: 'Quality Management System'           },
                { code: 'ISO 14001:2015', name: 'Environmental Management'             },
                { code: 'ISO 45001:2018', name: 'Occupational Health & Safety'         },
                { code: 'DEFENSE',        name: 'Strategic Sector · Cleared Facility'  },
              ].map((cert) => (
                <div
                  key={cert.code}
                  className="flex items-center gap-4 border border-border-hairline bg-bg-surface/30 px-4 py-3"
                >
                  <span className="text-accent-primary text-sm leading-none flex-shrink-0">✓</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[11px] font-semibold text-text-primary tracking-[0.06em]">
                      {cert.code}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted tracking-[0.04em]">
                      {cert.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0">
            {stats.map((stat, index) => (
              <div key={stat.id} className="relative flex flex-col">

                {/* Vertical divider */}
                {index < stats.length - 1 && (
                  <div
                    className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px bg-border-hairline"
                    style={{ height: '60px' }}
                    aria-hidden="true"
                  />
                )}

                {/* Mobile horizontal divider */}
                {index > 0 && index % 2 === 0 && (
                  <div className="lg:hidden absolute top-0 left-0 right-0 h-px bg-border-hairline" aria-hidden="true" />
                )}

                <div className={cn(
                  'flex flex-col items-start gap-2.5 px-6 py-10',
                  index === 0 && 'pl-0',
                  index === stats.length - 1 && 'pr-0',
                  stat.id === 'defense' && 'border-l-2 border-accent-primary pl-[22px]'
                )}>
                  {/* Number + Unit */}
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        'font-mono font-semibold text-text-primary leading-none',
                        stat.number.length > 5
                          ? 'text-[28px] tracking-[-0.02em]'
                          : 'text-number-lg-md lg:text-number-lg tracking-[-0.03em]'
                      )}
                    >
                      {stat.number}
                    </span>
                    {stat.unit && (
                      <span className="font-mono text-number-unit text-accent-steel leading-none">
                        {stat.unit}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <p className="font-sans text-label font-semibold uppercase tracking-[0.12em] text-text-muted leading-none">
                    {stat.label}
                  </p>

                  {/* Descriptor */}
                  {stat.descriptor && (
                    <p className="font-sans text-caption text-text-secondary leading-[1.5] mt-0.5">
                      {stat.descriptor}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </SectionContainer>
  )
}
