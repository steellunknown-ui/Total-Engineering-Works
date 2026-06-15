import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { HeroMotion, HeroMotionItem } from '@/components/sections/Hero/HeroMotion'
import { Shield } from 'lucide-react'

/**
 * DefenseHero — Cinematic entry for the Defense page.
 * 
 * Design: "Midnight Engineering" with High-Resolution Visual.
 * - Pure #000000 background.
 * - Cinematic macro image of defense manufacturing.
 * - High-authority headline.
 */
export function DefenseHero() {
  return (
    <section
      className="relative bg-bg-void border-b border-border-hairline pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden"
    >
      {/* Background Image & Gradient Overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image 
          src="/images/defense-hero.png" 
          alt="Advanced Defense Manufacturing"
          fill
          className="object-cover opacity-60 object-right md:object-center"
          priority
        />
        {/* Gradients for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-void via-bg-void/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-transparent to-transparent" />
      </div>

      <SectionContainer spacing="none" className="relative z-10">
        <HeroMotion className="flex flex-col gap-6 max-w-3xl">
          
          {/* Eyebrow label */}
          <HeroMotionItem>
            <div className="
              inline-flex items-center gap-2
              rounded-full border border-[#CC293640] bg-[#CC293610]
              px-4 py-1.5 w-fit
            ">
              <Shield size={14} className="text-[#CC2936]" />
              <p className="
                font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-[0.12em]
                text-[#CC2936]
              ">
                Strategic Defense Manufacturing
              </p>
            </div>
          </HeroMotionItem>

          {/* Main headline */}
          <HeroMotionItem>
            <h1 className="
              font-sans font-semibold
              text-display-sm md:text-display-md
              leading-[1.06]
              tracking-[-0.03em]
              text-text-primary
            ">
              Defense <br className="hidden sm:block" />
              <span className="text-[#CC2936]">Project Portfolio</span>
            </h1>
          </HeroMotionItem>

          {/* Subheadline */}
          <HeroMotionItem>
            <p className="
              font-sans text-body-lg text-text-secondary
              leading-[1.65] max-w-2xl
            ">
              High-precision engineering for India's strategic sectors. 
              Certified manufacturing of armored vehicle sub-assemblies, 
              ballistic sensors, and tactical electronics.
            </p>
          </HeroMotionItem>

          {/* Trust strip */}
          <HeroMotionItem className="flex flex-wrap gap-x-10 gap-y-6 mt-4 pt-6 border-t border-border-hairline">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-xl text-text-primary">MIL-STD</span>
              <span className="font-sans text-[12px] text-text-muted uppercase tracking-[0.08em]">Compliant</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-xl text-text-primary">100%</span>
              <span className="font-sans text-[12px] text-text-muted uppercase tracking-[0.08em]">Traceable</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-xl text-text-primary">Grade A</span>
              <span className="font-sans text-[12px] text-text-muted uppercase tracking-[0.08em]">Precision</span>
            </div>
          </HeroMotionItem>

        </HeroMotion>
      </SectionContainer>
    </section>
  )
}
