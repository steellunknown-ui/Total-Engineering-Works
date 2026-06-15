import { Button }           from '@/components/ui/Button'
import { HeroMotion, HeroMotionItem, HeroVisualMotion } from './HeroMotion'
import { HeroVisual, HeroVisualFallback }               from './HeroVisual'
import { HeroCounterBar }     from './HeroCounterBar'
import { HeroActions }        from './HeroActions'
import { heroContent }      from '@/config/hero'
import { clients }          from '@/config/clients'
import { GridBackground } from '@/components/ui/GridBackground'

/**
 * Hero — Section 1. Full-viewport. Apple-grade cinematic entry.
 *
 * Design: "Midnight Engineering"
 *  - Pure #000000 background — zero compromise
 *  - Headline at clamp(56px,8vw,96px) — tight -0.04em tracking
 *  - Blueprint grid SVG fills the right visual panel
 *  - Trust strip below the fold — Apple-style reveal on scroll
 *  - Backdrop-blur navbar becomes solid after 80px scroll
 *
 * Server Component (RSC). Motion isolated to HeroMotion client boundaries.
 */
export function Hero() {
  const photoExists = heroContent.photoReady

  return (
    <section
      id="hero"
      aria-label="Tatva Dynamics — Precision Manufacturing, Intelligent Engineering"
      className="relative bg-bg-void min-h-[calc(100vh-72px)] flex flex-col"
    >
      {/* Dynamic Grid Background */}
      <GridBackground />

      {/* ── Main content + visual split ─────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Left: Content column ────────────────────────── */}
        <div className="
          relative overflow-hidden
          flex-1 flex items-center
          px-6 md:px-10 xl:px-container-x
          pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-0 lg:pb-0
        ">
          {/* Electrical grid — behind headline content */}
          <HeroMotion className="relative z-10 flex flex-col gap-8 max-w-[660px] w-full">

            {/* Eyebrow label */}
            <HeroMotionItem>
              <div className="
                inline-flex items-center gap-2
                rounded-full border border-border-default bg-bg-surface/30
                px-4 py-1.5 w-fit
              ">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                <p className="
                  font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-[0.12em]
                  text-accent-primary
                ">
                  {heroContent.eyebrow}
                </p>
              </div>
            </HeroMotionItem>

            {/* Main headline — Apple display scale */}
            <HeroMotionItem>
              <h1 className="
                font-sans font-semibold
                text-hero-sm md:text-hero-md lg:text-hero
                leading-[1.02]
                tracking-[-0.04em]
              ">
                {heroContent.headline.split('\n').map((line, idx, arr) => (
                  <span
                    key={idx}
                    className={
                      idx === arr.length - 1 ? 'text-accent-primary block' : 'text-text-primary block'
                    }
                  >
                    {line}
                  </span>
                ))}
              </h1>
            </HeroMotionItem>

            {/* Subheadline — Apple 17px body */}
            <HeroMotionItem>
              <p className="
                font-sans text-body-lg text-text-secondary
                leading-[1.65] max-w-[50ch]
              ">
                {heroContent.subheadline}
              </p>
            </HeroMotionItem>

            {/* CTA group */}
            <HeroMotionItem>
              <HeroActions />

              {/* Confidence microcopy */}
              <p className="mt-3 font-mono text-[11px] text-text-muted tracking-[0.06em]">
                Typical RFQ response within 24 hours · NDA available on request
              </p>
            </HeroMotionItem>

            {/* Animated stats row */}
            <HeroMotionItem>
              <HeroCounterBar />
            </HeroMotionItem>

          </HeroMotion>
        </div>

        {/* ── Right: Visual panel ─────────────────────────── */}
        <HeroVisualMotion className="
          hidden md:block
          md:h-72 lg:h-auto
          md:w-full lg:w-[45%] lg:flex-shrink-0
          relative
        ">
          {photoExists ? <HeroVisual /> : <HeroVisualFallback />}
        </HeroVisualMotion>

      </div>

      {/* ── Trust pillars strip ───────────────────────────── */}
      {/*
       * Thin top border separates the hero from evidence.
       * Apple-style: no card, no shadow — just tonal shift.
       */}
      <div className="border-t border-border-hairline bg-bg-section-alt">
        <div className="
          mx-auto w-full max-w-container
          px-6 md:px-10 xl:px-container-x
          py-section-xs
        ">

          {/* Trust pillar row */}
          <div className="
            grid grid-cols-2 md:grid-cols-4
            gap-6 md:gap-8
            mb-8 pb-8 border-b border-border-hairline
          ">
            {heroContent.trustPillars.map((pillar) => (
              <div key={pillar.label} className="flex flex-col gap-1.5">
                <span className="
                  font-sans font-semibold text-[14px]
                  text-text-primary tracking-[-0.01em]
                ">
                  {pillar.label}
                </span>
                <span className="font-mono text-[11px] text-text-muted tracking-[0.06em]">
                  {pillar.detail}
                </span>
              </div>
            ))}
          </div>

          {/* Client name strip */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-label uppercase tracking-[0.14em] text-text-muted">
              Trusted by Global Industrial Leaders
            </p>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              {clients.map((client) => (
                <span
                  key={client.id}
                  className="
                    font-sans font-semibold text-[13px] tracking-[0.06em] uppercase
                    text-text-muted hover:text-text-secondary
                    transition-colors duration-200 select-none cursor-default
                  "
                  aria-label={client.name}
                >
                  {client.name}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

    </section>
  )
}
