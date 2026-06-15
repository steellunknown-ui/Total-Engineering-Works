import Image from 'next/image'
import { capabilities }      from '@/config/capabilities'
import type { Capability }   from '@/types'
import { SectionContainer }  from '@/components/layout/SectionContainer'
import { FadeIn }            from '@/components/motion/FadeIn'
import { ScrollReveal }      from '@/components/motion/ScrollReveal'


/**
 * Capabilities — Six core manufacturing disciplines.
 *
 * Each card:
 *  - Top: full-width image (object-cover) with bottom fade overlay
 *  - Bottom: title + description + mono tags
 *
 * Cards sit on the electrical grid background.
 * Server Component.
 */
function CapabilityCard({ cap }: { cap: Capability }) {
  return (
    <article className="
      group flex flex-col
      border border-border-hairline
      hover:border-border-default
      transition-colors duration-300
      bg-bg-base/80 backdrop-blur-[2px]
      overflow-hidden h-full
    ">
      {/* ── Image panel ─────────────────────────────── */}
      {cap.image && (
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          <Image
            src={cap.image}
            alt={cap.title}
            fill
            className="object-cover object-center
              group-hover:scale-[1.04] transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Bottom fade — blends image into the card content below */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, var(--bg-base) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* ── Content panel ────────────────────────────── */}
      <div className="flex flex-col gap-4 p-7 flex-1">

        {/* Title */}
        <h3 className="font-sans font-semibold text-[17px] md:text-[18px] text-text-primary tracking-[-0.02em] leading-[1.25]">
          {cap.title}
        </h3>

        {/* Description */}
        <p className="font-sans text-body text-text-secondary leading-[1.65] flex-1">
          {cap.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-1">
          {cap.tags.map((tag) => (
            <span
              key={tag}
              className="
                font-mono text-[10px] uppercase tracking-[0.10em]
                text-accent-steel
                border border-border-hairline
                px-2.5 py-1
              "
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

export function Capabilities() {
  return (
    <SectionContainer
      background="none"
      spacing="default"
      id="capabilities"
      className="relative overflow-hidden bg-bg-base border-b border-border-hairline"
    >
      {/* Background Image - Precision Macro */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/capabilities-bg.png"
          alt="Manufacturing Capabilities Infrastructure"
          fill
          className="object-cover opacity-50"
          priority
        />
        {/* Dark overlays to maintain Midnight Engineering aesthetic and text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base via-bg-base/40 to-bg-base" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content above background */}
      <div className="relative z-10">
        <FadeIn>
          {/* Section header — 2-column */}
          <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left — heading */}
            <div className="flex flex-col gap-3">
              <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
                Manufacturing Capabilities
              </p>
              <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
                Six disciplines.<br />One supplier.<br />Zero compromises.
              </h2>
              <p className="font-sans text-body text-text-secondary max-w-[52ch] leading-[1.70] mt-2">
                Every process is performed in-house at our 30,000 sq ft facility.
                No critical work leaves the building.
              </p>
            </div>

            {/* Right — in-house promise checklist */}
            <div className="flex flex-col gap-3 lg:pt-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-steel mb-1">
                The In-House Promise
              </p>
              {[
                'Single point of contact for all 6 disciplines',
                'Full component traceability to raw material',
                'No critical process subcontracted — ever',
                'Drawing-to-delivery in one facility',
                'NDA signed before any technical discussion',
              ].map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 border border-border-hairline bg-bg-surface/30 px-4 py-3"
                >
                  <span className="text-accent-primary text-sm leading-none mt-0.5 flex-shrink-0">✓</span>
                  <span className="font-sans text-[13px] text-text-secondary leading-[1.5]">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3×2 capability grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-hairline">
            {capabilities.map((cap, index) => (
              <ScrollReveal key={cap.id} delay={index * 0.07} className="h-full">
                <CapabilityCard cap={cap} />
              </ScrollReveal>
            ))}
          </div>

        </FadeIn>
      </div>
    </SectionContainer>
  )
}
