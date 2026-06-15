import Image from 'next/image'
import { machines }          from '@/config/machines'
import { SectionContainer }  from '@/components/layout/SectionContainer'
import { FadeIn }            from '@/components/motion/FadeIn'
import { ScrollReveal }      from '@/components/motion/ScrollReveal'
import { cn }                from '@/utils/cn'

/**
 * MachineMatrix — Capital equipment specification table.
 *
 * Each machine row: specs on the LEFT (flex-1) + machine photo on the RIGHT.
 * Image uses object-contain so nothing is ever cropped.
 * Left/top edge of image fades into the section background via gradient overlay.
 *
 * Server Component.
 */
export function MachineMatrix() {
  return (
    <SectionContainer
      background="surface"
      spacing="default"
      id="infrastructure"
      className="border-b border-border-hairline"
    >
      <FadeIn>
        {/* Section label */}
        <div className="mb-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left — heading */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
              Capital Equipment
            </p>
            <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
              Built on the machines<br className="hidden md:block" /> the best use.
            </h2>
            <p className="font-sans text-body text-text-secondary max-w-[54ch] leading-[1.70] mt-2">
              Every capability is backed by named capital equipment with verifiable specifications.
              No subcontracting on critical processes.
            </p>
          </div>

          {/* Right — facility quick-stats */}
          <div className="grid grid-cols-3 gap-4 lg:pt-4">
            {[
              { value: '30,000', unit: 'sq ft', label: 'Manufacturing\nFacility' },
              { value: '15+',    unit: '',      label: 'Capital\nMachines'       },
              { value: '0%',     unit: '',      label: 'Critical Work\nSubcontracted' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-2 border border-border-hairline p-5 bg-bg-surface/40"
              >
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-semibold text-[28px] md:text-[32px] text-text-primary leading-none tracking-[-0.03em]">
                    {item.value}
                  </span>
                  {item.unit && (
                    <span className="font-mono text-[12px] text-accent-steel leading-none">{item.unit}</span>
                  )}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted leading-[1.5] whitespace-pre-line">
                  {item.label}
                </span>
              </div>
            ))}

            {/* No-subcontracting promise */}
            <div className="col-span-3 border border-border-hairline border-l-2 border-l-accent-primary bg-bg-surface/40 px-5 py-4 flex items-center gap-3">
              <span className="text-accent-primary text-lg leading-none">✦</span>
              <p className="font-mono text-[11px] uppercase tracking-[0.10em] text-text-secondary leading-[1.5]">
                All 3 machines operated on-site · Full in-house control · No critical process outsourced
              </p>
            </div>
          </div>
        </div>

        {/* Machine rows */}
        <div className="flex flex-col">
          {machines.map((machine, index) => (
            <ScrollReveal key={machine.id} delay={index * 0.10} direction="left">
              <div
                className={cn(
                  'group border-t border-border-hairline',
                  index === machines.length - 1 && 'border-b'
                )}
              >
              {/* Row: specs (left) + image (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">

                {/* ── Left: Specs ─────────────────────────────────── */}
                <div className="py-10 pr-0 lg:pr-10">

                  {/* Machine header */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-baseline gap-2 md:gap-8 mb-6">
                    <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-5">
                      <span className="font-mono text-spec-sm uppercase tracking-[0.12em] text-accent-steel">
                        {machine.manufacturer}
                      </span>
                      <span className="font-sans font-semibold text-[22px] md:text-[26px] text-text-primary tracking-[-0.02em]">
                        {machine.model}
                      </span>
                    </div>
                    <span className="font-mono text-spec-sm text-text-muted tracking-[0.06em] uppercase">
                      {machine.category}
                    </span>
                  </div>

                  {/* Spec strip */}
                  <div className="flex flex-wrap gap-y-4">
                    {machine.specs.map((spec, si) => (
                      <div
                        key={spec.label}
                        className={cn(
                          'flex flex-col gap-1 pr-8 md:pr-12',
                          si > 0 && 'border-l border-border-hairline pl-8 md:pl-12'
                        )}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          {spec.label}
                        </span>
                        <span className={cn(
                          'font-mono font-semibold text-[14px] md:text-[15px]',
                          spec.label === 'Tolerance' || spec.label === 'Positioning' || spec.label === 'Accuracy'
                            ? 'text-accent-primary'
                            : 'text-text-primary'
                        )}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right: Machine image ──────────────────────────── */}
                {machine.image && (
                  <div className="
                    relative hidden lg:block
                    border-l border-border-hairline
                    overflow-hidden
                    bg-bg-void
                  ">
                    <Image
                      src={machine.image}
                      alt={`${machine.manufacturer} ${machine.model}`}
                      fill
                      className="object-contain object-center p-4
                        group-hover:scale-[1.03] transition-transform duration-700"
                      sizes="380px"
                    />
                    {/* Left-edge fade — blends image into spec column */}
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to right, var(--bg-surface) 0%, transparent 30%)',
                      }}
                    />
                    {/* Bottom-edge fade */}
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to top, var(--bg-surface) 0%, transparent 25%)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-10 font-mono text-[11px] text-text-muted tracking-[0.06em]">
          All equipment operated on-site at our 30,000 sq ft manufacturing facility.
          No critical process subcontracted.
        </p>
      </FadeIn>
    </SectionContainer>
  )
}
