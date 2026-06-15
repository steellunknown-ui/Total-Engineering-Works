import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'

/**
 * ContactHero — High-impact entry for the Contact page.
 * Uses a cinematic facility visual with a modern typographic treatment.
 */
export function ContactHero() {
  return (
    <section className="relative h-[60vh] md:h-[70vh] flex flex-col justify-end overflow-hidden bg-bg-void">
      {/* Background Image & Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/contact-hero.png" 
          alt="Tatva Dynamics Manufacturing Facility"
          fill
          className="object-cover opacity-60 transition-all duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-bg-void/60 to-transparent" />
      </div>

      <SectionContainer spacing="none" className="relative z-10 pb-16 md:pb-24">
        <FadeIn>
          <div className="flex flex-col gap-4 max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary font-bold">
              Connect with us
            </p>
            <h1 className="font-sans font-bold text-display-sm md:text-display-md text-text-primary tracking-[-0.03em] leading-tight">
              Get In Touch
            </h1>
            <p className="font-sans text-body-lg text-text-secondary leading-relaxed max-w-2xl">
              Let's discuss how we can support your manufacturing needs with 
              precision engineering and strategic scale.
            </p>
          </div>
        </FadeIn>
      </SectionContainer>
    </section>
  )
}
