import Image from 'next/image'
import { row1Logos, row2Logos, row3Logos } from '@/config/clientLogos'
import type { ClientLogo } from '@/config/clientLogos'

/**
 * LogoSlider — Three-row infinite marquee of client company logos.
 *
 * Architecture:
 *  - Each row renders logos TWICE side-by-side (seamless loop)
 *  - CSS keyframes animate translateX(0 → -50%) creating infinite scroll
 *  - Row 1: scrolls LEFT  at 38s (slow, relaxed)
 *  - Row 2: scrolls RIGHT at 30s (medium, opposite direction)
 *  - Row 3: scrolls LEFT  at 24s (faster, energetic)
 *  - Edge-fade mask: logos dissolve to transparent at both edges
 *  - Hover row: pauses animation via CSS .logo-row:hover .logo-track
 *  - Logo filter: grayscale + reduced opacity → full colour on card hover
 *
 * Server Component — pure HTML/CSS, zero JS, zero hydration cost.
 */

// ── Logo card dimensions ────────────────────────────────────────────────
const CARD_W  = 188  // px — wide enough for horizontal wordmarks
const CARD_H  = 80   // px — tall enough for tall marks without cropping
const CARD_GAP = 16  // px — gap between cards

interface RowProps {
  logos:     ClientLogo[]
  direction: 'left' | 'right'
  duration:  number            // animation duration in seconds
}

function LogoRow({ logos, direction, duration }: RowProps) {
  // Duplicate the array so the strip is 2× wide — enables seamless loop
  const doubled = [...logos, ...logos]

  // Total inner width (px): (card + gap) × total card count
  const trackWidth = (CARD_W + CARD_GAP) * doubled.length

  return (
    <div className="logo-row overflow-hidden w-full logo-slider-mask">
      <div
        className="logo-track flex"
        style={{
          width:     `${trackWidth}px`,
          gap:       `${CARD_GAP}px`,
          animation: `marquee-${direction} ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {doubled.map((logo, i) => (
          <div
            key={`${logo.id}-${i}`}
            className="
              flex-shrink-0
              flex items-center justify-center
              rounded-[10px]
              border border-border-hairline
              bg-bg-surface/40
            "
            style={{
              width:   `${CARD_W}px`,
              height:  `${CARD_H}px`,
              padding: '14px 20px',
            }}
            title={logo.name}
          >
            <Image
              src={`/logos/${logo.file}`}
              alt={logo.name}
              width={CARD_W - 40}
              height={CARD_H - 28}
              className="w-full h-full object-contain object-center"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

import { GridBackground } from '@/components/ui/GridBackground'

export function LogoSlider() {
  return (
    <section
      id="customers"
      aria-label="Our Customers"
      className="bg-bg-section-alt border-b border-border-hairline overflow-hidden"
    >
      {/* Section header */}
      <div className="mx-auto max-w-container px-6 md:px-10 xl:px-container-x pt-16 pb-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-accent-steel">
            Trusted By Industry Leaders
          </p>
          <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md text-text-primary leading-[1.06] tracking-[-0.03em]">
            Our Customers
          </h2>
          <p className="font-sans text-body text-text-secondary max-w-[48ch] leading-[1.65] mt-1">
            From energy infrastructure to defense systems —
            trusted by multinational OEMs across five sectors since 1999.
          </p>
        </div>
      </div>

      {/* 3-row marquee grid */}
      <div className="flex flex-col gap-4 pb-16">

        {/* Row 1 — scrolls left, slowest */}
        <LogoRow
          logos={row1Logos}
          direction="left"
          duration={38}
        />

        {/* Row 2 — scrolls right, medium speed */}
        <LogoRow
          logos={row2Logos}
          direction="right"
          duration={30}
        />

        {/* Row 3 — scrolls left, fastest */}
        <LogoRow
          logos={row3Logos}
          direction="left"
          duration={24}
        />

      </div>

      {/* Footer note */}
      <div className="mx-auto max-w-container px-6 md:px-10 xl:px-container-x pb-12 flex justify-center">
        <p className="font-mono text-[11px] text-text-muted tracking-[0.06em] text-center max-w-[60ch] leading-[1.6]">
          Client relationships are subject to non-disclosure agreements.
          Project-specific references available upon formal engagement.
        </p>
      </div>
    </section>
  )
}
