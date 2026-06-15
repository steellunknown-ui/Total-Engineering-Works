import { RFQActions } from './RFQActions'
import { siteConfig } from '@/config/site'
import { GridBackground } from '@/components/ui/GridBackground'

/**
 * RFQSection — Full-bleed conversion section.
 *
 * Design: electrical grid + radial accent glow = energy radiating
 * outward from the CTA. The most cinematic section on the page.
 *
 * Layer order (bottom → top):
 *  1. GridBackground (canvas) — live electrical pulse grid
 *  2. Radial accent glow (div) — soft spotlight on the CTA
 *  3. Content (z-10)
 */
export function RFQSection() {
  return (
    <section
      id="rfq"
      aria-label="Request for Quotation"
      className="relative overflow-hidden bg-bg-void border-b border-border-hairline"
    >
      {/* Dynamic Grid Background */}
      <GridBackground />
      {/* Layer 1 — Electrical grid */}
      {/* Layer 2 — Theme-aware radial glow (sits above grid, below text) */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse 900px 600px at 50% 50%, rgba(var(--accent-primary-rgb),0.12) 0%, transparent 70%)',
        }}
      />

      {/* Layer 3 — Content */}
      <div className="relative z-10 mx-auto max-w-container px-6 md:px-10 xl:px-container-x py-section flex flex-col items-center text-center gap-10">

        {/* Eyebrow */}
        <p className="font-mono text-label uppercase tracking-[0.16em] text-accent-steel">
          Start a Conversation
        </p>

        {/* Headline — display scale */}
        <h2 className="
          font-sans font-semibold
          text-display-sm md:text-display-md lg:text-display
          text-text-primary
          leading-[1.02] tracking-[-0.04em]
          max-w-[20ch]
        ">
          Ready to qualify<br className="hidden sm:block" /> Tatva Dynamics<br className="hidden sm:block" /> as your supplier?
        </h2>

        {/* Supporting copy */}
        <p className="font-sans text-body-lg text-text-secondary leading-[1.65] max-w-[46ch]">
          Send your engineering drawings and requirements.
          Our team responds within 24 hours with a formal quotation.
        </p>

        {/* CTA group */}
        <RFQActions />

        {/* Contact strip */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 pt-4">
          <a
            href={`mailto:${siteConfig.contact.rfqEmail}`}
            className="font-mono text-[13px] text-accent-primary hover:text-accent-primary-hover transition-colors duration-150 tracking-[0.04em]"
          >
            {siteConfig.contact.rfqEmail}
          </a>
          <span className="hidden sm:block w-px h-4 bg-border-hairline" />
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="font-mono text-[13px] text-text-muted hover:text-text-secondary transition-colors duration-150 tracking-[0.04em]"
          >
            {siteConfig.contact.phone}
          </a>
          <span className="hidden sm:block w-px h-4 bg-border-hairline" />
          <span className="font-mono text-[12px] text-text-muted tracking-[0.04em]">
            NDA available on request
          </span>
        </div>

      </div>
    </section>
  )
}
