'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn }            from '@/components/motion/FadeIn'
import { ScrollReveal }      from '@/components/motion/ScrollReveal'
import { GridBackground } from '@/components/ui/GridBackground'

/* ── Certification data ──────────────────────────────────────────────────── */
const certifications = [
  {
    id:       'iso9001',
    code:     'ISO 9001:2015',
    standard: 'Quality Management System',
    body:     'Bureau Veritas',
    scope:    'Design, manufacture and supply of precision engineered components',
    icon:     'QMS',
    accent:   true,
  },
  {
    id:       'iso14001',
    code:     'ISO 14001:2015',
    standard: 'Environmental Management',
    body:     'Bureau Veritas',
    scope:    'Environmental controls across all manufacturing processes',
    icon:     'EMS',
    accent:   false,
  },
  {
    id:       'iso45001',
    code:     'ISO 45001:2018',
    standard: 'Occupational Health & Safety',
    body:     'Bureau Veritas',
    scope:    'Occupational health and safety management — full facility',
    icon:     'OH&S',
    accent:   false,
  },
  {
    id:       'defense',
    code:     'DEFENSE CLEARED',
    standard: 'Strategic Sector Supplier',
    body:     'Govt. of India / DRDO',
    scope:    'Active supplier to defence and strategic-sector OEMs',
    icon:     'DEF',
    accent:   false,
  },
] as const

/* ── Trust pillars rendered below the cert cards ─────────────────────────── */
const trustPillars = [
  { label: 'Third-Party Audited',    sub: 'Annual surveillance audits — no self-certification' },
  { label: 'Zero NCRs — 3 Years',   sub: 'Three consecutive audit cycles with zero non-conformances' },
  { label: 'Full Traceability',      sub: 'Material, process and inspection records for every part' },
  { label: 'Calibrated Equipment',   sub: 'All gauges NABL-traceable — measurement confidence guaranteed' },
]

/* ── Component ───────────────────────────────────────────────────────────── */
export function Certifications() {
  return (
    <SectionContainer
      background="none"
      spacing="default"
      id="certifications"
      className="relative overflow-hidden bg-bg-section-alt border-b border-border-hairline"
    >
      {/* Dynamic Grid Background */}
      <GridBackground />
      {/* Subtle grid backdrop */}
      <div className="relative z-10">
        <FadeIn>

          {/* ── Section header ─────────────────────────────────────────── */}
          <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end">

            {/* Left */}
            <div className="flex flex-col gap-4">
              <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
                Quality &amp; Compliance
              </p>
              <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
                Certified to the<br />
                standards that<br />
                procurement demands.
              </h2>
            </div>

            {/* Right — context statement */}
            <div className="flex flex-col gap-5 lg:pb-1">
              <p className="font-sans text-body text-text-secondary leading-[1.72] max-w-[52ch]">
                Every certificate listed here is independently audited — not self-declared.
                Our quality infrastructure is designed around one principle: when your part
                ships, you already know it's right.
              </p>
              {/* Verified badge */}
              <div className="inline-flex items-center gap-3 border border-accent-primary/30 bg-accent-primary/5 px-4 py-3 w-fit">
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full bg-accent-primary animate-pulse flex-shrink-0"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-primary">
                  All certifications independently verified · Audit records available on request
                </span>
              </div>
            </div>
          </div>

          {/* ── Certification cards ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-hairline mb-px">
            {certifications.map((cert, i) => (
              <ScrollReveal key={cert.id} delay={i * 0.08} direction="up" className="h-full">
                <article
                  className={[
                    'group relative flex flex-col bg-bg-base h-full',
                    'border-0 overflow-hidden',
                    'transition-colors duration-300',
                    'hover:bg-bg-elevated',
                  ].join(' ')}
                >
                  {/* Top accent bar */}
                  <div
                    className={[
                      'h-[2px] w-full',
                      cert.accent
                        ? 'bg-accent-primary'
                        : 'bg-border-hairline group-hover:bg-accent-primary/40 transition-colors duration-500',
                    ].join(' ')}
                  />

                  <div className="flex flex-col gap-5 p-7 flex-1">

                    {/* Icon badge */}
                    <div className="flex items-start justify-between">
                      <div
                        className={[
                          'font-mono text-[11px] font-bold tracking-[0.12em] uppercase',
                          'border px-3 py-1.5 w-fit',
                          cert.accent
                            ? 'border-accent-primary/50 text-accent-primary bg-accent-primary/8'
                            : 'border-border-default text-text-muted bg-bg-elevated',
                        ].join(' ')}
                      >
                        {cert.icon}
                      </div>
                      {/* Shield SVG */}
                      <svg
                        width="22" height="26" viewBox="0 0 22 26"
                        fill="none" aria-hidden="true"
                        className="opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                      >
                        <path
                          d="M11 1L1 5V13C1 18.55 5.34 23.74 11 25C16.66 23.74 21 18.55 21 13V5L11 1Z"
                          stroke="currentColor" strokeWidth="1.5"
                          className="text-accent-primary"
                        />
                        <path
                          d="M7 13L10 16L15 10"
                          stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          className="text-accent-primary"
                        />
                      </svg>
                    </div>

                    {/* Code + standard */}
                    <div className="flex flex-col gap-1.5">
                      <p className="font-mono text-[13px] font-semibold text-text-primary tracking-[0.04em]">
                        {cert.code}
                      </p>
                      <p className="font-sans text-[15px] font-semibold text-text-primary leading-[1.3] tracking-[-0.015em]">
                        {cert.standard}
                      </p>
                    </div>

                    {/* Scope */}
                    <p className="font-sans text-caption text-text-secondary leading-[1.6] flex-1">
                      {cert.scope}
                    </p>

                    {/* Issuing body */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border-hairline">
                      <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-text-muted">
                        Issued by
                      </span>
                      <span className="font-mono text-[10px] text-accent-steel tracking-[0.06em]">
                        {cert.body}
                      </span>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>

          {/* ── Trust pillars row ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-hairline mt-px">
            {trustPillars.map((pillar, i) => (
              <ScrollReveal key={pillar.label} delay={i * 0.07} direction="up" className="h-full">
                <div className="flex flex-col gap-2 bg-bg-base/60 px-6 py-5 h-full hover:bg-bg-elevated transition-colors duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-accent-primary text-[13px] leading-none flex-shrink-0">✓</span>
                    <p className="font-sans text-[13px] font-semibold text-text-primary tracking-[-0.01em]">
                      {pillar.label}
                    </p>
                  </div>
                  <p className="font-sans text-caption text-text-muted leading-[1.55] pl-5">
                    {pillar.sub}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </FadeIn>
      </div>
    </SectionContainer>
  )
}
