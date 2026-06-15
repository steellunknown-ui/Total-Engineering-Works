import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { FadeIn } from '@/components/motion/FadeIn'

const CERTIFICATES = [
  {
    id: 'iso-9001',
    label: 'ISO 9001:2015',
    image: '/images/certs/iso-9001.png',
  },
  {
    id: 'iso-14001',
    label: 'ISO 14001:2015',
    image: '/images/certs/iso-14001.png',
  },
  {
    id: 'iso-45001',
    label: 'ISO 45001:2018',
    image: '/images/certs/iso-45001.png',
  },
]

/**
 * DefenseCompliance — Authority section showcasing manufacturing standards and certificates.
 */
export function DefenseCompliance() {
  return (
    <SectionContainer background="surface" spacing="default" className="border-y border-border-hairline">
      
      {/* ── Section Header ─────────────────────────────────────────── */}
      <FadeIn>
        <div className="mb-16 flex flex-col gap-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1px] bg-[#CC2936]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#CC2936] font-bold">
              Quality Standards
            </p>
          </div>
          <h2 className="font-sans font-semibold text-[36px] md:text-[56px] text-text-primary leading-[1.1] tracking-[-0.03em]">
            Manufacturing Excellence for Defense
          </h2>
          <p className="font-sans text-body-lg text-text-secondary leading-relaxed max-w-2xl">
            We adhere to the most stringent quality protocols and international standards for defense manufacturing, 
            ensuring every component meets India's strategic defense specifications.
          </p>
        </div>
      </FadeIn>

      {/* ── Certificate Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {CERTIFICATES.map((cert, idx) => (
          <ScrollReveal key={cert.id} delay={idx * 0.1}>
            <div className="group flex flex-col gap-5">
              <div className="relative aspect-[1/1.4] w-full bg-white rounded-2xl overflow-hidden border border-border-hairline shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <Image
                  src={cert.image}
                  alt={cert.label}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="font-sans font-bold text-[18px] text-text-primary tracking-tight">
                  {cert.label}
                </span>
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.1em]">
                  Certified Facility
                </span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* ── Authority Banner ────────────────────────────────────────── */}
      <ScrollReveal delay={0.4} className="p-8 md:p-12 bg-bg-void border border-[#CC293620] relative overflow-hidden rounded-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-[600px]">
            <h4 className="font-sans font-semibold text-[24px] md:text-[28px] text-text-primary tracking-tight">
              Classified & Strategic Manufacturing
            </h4>
            <p className="font-sans text-body text-text-secondary">
              Due to the sensitive nature of tactical hardware, many of our defense engagements are subject to non-disclosure agreements. 
              Full capability mapping is available to authorized procurement personnel.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#CC2936] font-bold">Traceability Level</span>
            <span className="font-sans font-bold text-[32px] text-text-primary">100% Guaranteed</span>
          </div>
        </div>
        
        {/* Subtle crimson accent glow */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#CC293608] blur-[100px] rounded-full" />
      </ScrollReveal>

    </SectionContainer>
  )
}

