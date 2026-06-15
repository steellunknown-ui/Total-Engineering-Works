'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn }            from '@/components/motion/FadeIn'
import { ScrollReveal }      from '@/components/motion/ScrollReveal'

import { GridBackground }     from '@/components/ui/GridBackground'

/* ── Process step data ───────────────────────────────────────────────────── */
const steps = [
  {
    id:          'dfm',
    number:      '01',
    phase:       'DFM Review',
    headline:    'Design for Manufacturability',
    description:
      'We examine every drawing before a chip falls. Our engineers flag tolerance stack-ups, material conflicts, and geometric constraints — preventing costly redesigns after production begins.',
    outputs:     ['DFM Report', 'Tolerance analysis', 'Material recommendation'],
    duration:    '24 – 72 hrs',
  },
  {
    id:          'prototype',
    number:      '02',
    phase:       'Prototype',
    headline:    'First Article & Validation',
    description:
      'A physical first article is produced on the same machines as production. Every critical dimension is documented in a FAIR report before any quantity commitment.',
    outputs:     ['First Article Report', 'CMM dimensional report', 'Material cert'],
    duration:    '3 – 10 days',
  },
  {
    id:          'production',
    number:      '03',
    phase:       'Production',
    headline:    'Volume Manufacturing',
    description:
      'Approved tooling and programs are locked. CNC cells run with in-process statistical control. Every operation is traceable to a specific machine, operator, and shift timestamp.',
    outputs:     ['In-process SPC data', 'Traveller records', 'Batch traceability'],
    duration:    'Per agreed schedule',
  },
  {
    id:          'qc',
    number:      '04',
    phase:       'Quality Control',
    headline:    'Final Inspection & Release',
    description:
      'Every batch passes a full dimensional audit on our Mitutoyo CMM. Hardness, surface finish, and coating thickness are verified before the packing slip is generated.',
    outputs:     ['CMM inspection report', 'Certificate of Conformance', 'Calibration traceability'],
    duration:    '< 24 hrs per batch',
  },
  {
    id:          'delivery',
    number:      '05',
    phase:       'Delivery',
    headline:    'Protected Packaging & Handoff',
    description:
      'Parts are individually wrapped, labelled with job number, revision, and material heat code, then shipped with a full documentation package. On-time delivery tracked and reported monthly.',
    outputs:     ['Packing manifest', 'Test / CoC documentation', 'OTD performance report'],
    duration:    'Per agreed Incoterms',
  },
] as const

/* ── Component ───────────────────────────────────────────────────────────── */
export function ProcessTimeline() {
  return (
    <SectionContainer
      background="base"
      spacing="default"
      id="process"
      className="relative overflow-hidden border-b border-border-hairline"
    >
      <div className="relative z-10">
        <FadeIn>

          {/* ── Section header ─────────────────────────────────────────── */}
          <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end">

            {/* Left */}
            <div className="flex flex-col gap-4">
              <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
                How We Work
              </p>
              <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
                Five gates.<br />
                Zero surprises.<br />
                Every order.
              </h2>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-5 lg:pb-1">
              <p className="font-sans text-body text-text-secondary leading-[1.72] max-w-[52ch]">
                Every RFQ becomes a governed, documented process — not a promise.
                Each gate produces tangible outputs you can audit, so you always
                know exactly where your order stands and what evidence backs it.
              </p>
              <div className="inline-flex items-center gap-3 border border-border-default bg-bg-surface/40 px-4 py-3 w-fit">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">
                  DFM → Prototype → Production → QC → Delivery
                </span>
              </div>
            </div>
          </div>

          {/* ── Timeline — desktop: horizontal connector line ──────────── */}
          <div className="relative">

            {/* Horizontal connector line — desktop only */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-[38px] left-0 right-0 h-px bg-border-hairline z-0"
            />

            {/* Steps grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-border-hairline">
              {steps.map((step, i) => (
                <ScrollReveal key={step.id} delay={i * 0.10} direction="up">
                  <div className="group relative flex flex-col bg-bg-base h-full hover:bg-bg-elevated transition-colors duration-300">

                    {/* ── Step number + phase label ─── */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 px-6 pt-7 pb-0 relative z-10">

                      {/* Number circle */}
                      <div
                        className={[
                          'flex-shrink-0 w-[52px] h-[52px] md:w-[44px] md:h-[44px]',
                          'rounded-full border flex items-center justify-center',
                          'font-mono text-[13px] font-bold tracking-[0.02em]',
                          'transition-colors duration-300',
                          i === 0
                            ? 'border-accent-primary text-accent-primary bg-accent-primary/8 group-hover:bg-accent-primary/15'
                            : 'border-border-default text-text-muted bg-bg-surface group-hover:border-accent-primary/40 group-hover:text-text-secondary',
                        ].join(' ')}
                      >
                        {step.number}
                      </div>

                      {/* Phase pill */}
                      <span
                        className={[
                          'font-mono text-[10px] uppercase tracking-[0.14em] leading-none px-2.5 py-1',
                          i === 0
                            ? 'text-accent-primary border border-accent-primary/40 bg-accent-primary/8'
                            : 'text-accent-steel border border-border-hairline',
                        ].join(' ')}
                      >
                        {step.phase}
                      </span>
                    </div>

                    {/* ── Content ─────────────────── */}
                    <div className="flex flex-col gap-4 px-6 pt-5 pb-7 flex-1">

                      <h3 className="font-sans font-semibold text-[15px] md:text-[14px] xl:text-[15px] text-text-primary leading-[1.3] tracking-[-0.015em]">
                        {step.headline}
                      </h3>

                      <p className="font-sans text-caption text-text-secondary leading-[1.65] flex-1">
                        {step.description}
                      </p>

                      {/* Outputs list */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mb-0.5">
                          Deliverables
                        </p>
                        {step.outputs.map((out) => (
                          <div key={out} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-accent-primary/60 flex-shrink-0" />
                            <span className="font-mono text-[10px] text-text-secondary tracking-[0.04em]">
                              {out}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Duration chip */}
                      <div className="flex items-center gap-2 pt-4 border-t border-border-hairline mt-1">
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
                          Typical lead
                        </span>
                        <span className="font-mono text-[10px] text-accent-steel tracking-[0.04em]">
                          {step.duration}
                        </span>
                      </div>
                    </div>

                    {/* Left accent bar on hover */}
                    <div
                      aria-hidden="true"
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-primary/0 group-hover:bg-accent-primary/60 transition-colors duration-400"
                    />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* ── Bottom assurance bar ───────────────────────────────────── */}
          <div className="mt-px grid grid-cols-1 sm:grid-cols-3 gap-px bg-border-hairline">
            {[
              { label: 'Fully Documented',     sub: 'Every gate generates auditable records' },
              { label: 'Buyer Can Intervene',  sub: 'First article approval is mandatory before volume' },
              { label: 'On-Time Tracked',      sub: 'Monthly OTD report shared with all key accounts' },
            ].map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 0.07}>
                <div className="flex items-start gap-4 bg-bg-base/60 px-6 py-5 h-full hover:bg-bg-elevated transition-colors duration-300">
                  <span className="text-accent-primary text-sm leading-none flex-shrink-0 mt-0.5">✓</span>
                  <div className="flex flex-col gap-1">
                    <p className="font-sans text-[13px] font-semibold text-text-primary tracking-[-0.01em]">
                      {item.label}
                    </p>
                    <p className="font-sans text-caption text-text-muted leading-[1.5]">
                      {item.sub}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </FadeIn>
      </div>
    </SectionContainer>
  )
}
