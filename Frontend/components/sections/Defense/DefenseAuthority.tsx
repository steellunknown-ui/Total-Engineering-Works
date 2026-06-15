'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { FadeIn } from '@/components/motion/FadeIn'
import { Shield, CheckCircle2 } from 'lucide-react'
import { GridBackground } from '@/components/ui/GridBackground'

const CAPABILITIES = [
  "Wind Sensors for T-90 Main Battle Tanks",
  "Tilt Sensors for T-90 Main Battle Tanks",
  "Digital Control Panels for BMP-II Tanks",
  "High-precision machined defense components",
  "Rigorous quality testing & compliance"
]

/**
 * DefenseAuthority — Authority section establishing trust with Armed Forces.
 * Positioned just below the Hero.
 */
export function DefenseAuthority() {
  return (
    <SectionContainer 
      background="void" 
      spacing="default" 
      className="relative border-b border-border-hairline overflow-hidden"
    >
      {/* Crimson Pulse Grid Background */}
      <div className="absolute inset-0 z-0" style={{ '--accent-primary-rgb': '204, 41, 54' } as React.CSSProperties}>
        <GridBackground />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content: Authority & List */}
        <div className="flex flex-col gap-8">
          <FadeIn>
            <div className="flex flex-col gap-4">
              <h2 className="font-sans font-bold text-[36px] md:text-[52px] text-text-primary leading-[1.1] tracking-[-0.03em]">
                Trusted by India's<br />Armed Forces
              </h2>
              <p className="font-sans text-body-lg text-text-secondary leading-relaxed max-w-[55ch]">
                Tatva Dynamics Pvt Ltd manufactures precision sensors and control panels 
                for India's frontline military vehicles, ensuring mission-critical 
                performance in the field.
              </p>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-4">
            {CAPABILITIES.map((item, idx) => (
              <ScrollReveal key={item} delay={0.2 + idx * 0.1} direction="left" distance={20}>
                <div className="flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#CC293610] flex items-center justify-center border border-[#CC293630] group-hover:bg-[#CC293620] transition-colors duration-300">
                    <CheckCircle2 size={16} className="text-[#CC2936]" />
                  </div>
                  <span className="font-sans text-[16px] md:text-[18px] text-text-primary/90 group-hover:text-white transition-colors duration-300">
                    {item}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Right Content: Visual Badge */}
        <ScrollReveal delay={0.5} direction="right" className="relative group">
          <div className="relative aspect-square max-w-[400px] mx-auto lg:ml-auto">
            {/* Outer Glow Circle */}
            <div className="absolute inset-0 bg-[#CC293610] rounded-full blur-[80px] animate-pulse" />
            
            {/* The Badge */}
            <div className="relative h-full w-full bg-bg-surface border border-border-hairline rounded-[40px] flex flex-col items-center justify-center p-12 text-center overflow-hidden shadow-2xl">
              {/* Internal Mesh Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#CC2936 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              <Shield size={80} strokeWidth={1} className="text-[#CC2936] mb-8 group-hover:scale-110 transition-transform duration-700 ease-out" />
              
              <h3 className="font-mono text-[40px] md:text-[52px] font-black text-white tracking-[0.1em] leading-none mb-4">
                DEFENSE
              </h3>
              <p className="font-mono text-[14px] md:text-[16px] font-bold text-[#CC2936] uppercase tracking-[0.4em]">
                Grade Quality
              </p>

              {/* Decorative corner lines */}
              <div className="absolute top-8 left-8 w-8 h-[1px] bg-[#CC293640]" />
              <div className="absolute top-8 left-8 w-[1px] h-8 bg-[#CC293640]" />
              <div className="absolute bottom-8 right-8 w-8 h-[1px] bg-[#CC293640]" />
              <div className="absolute bottom-8 right-8 w-[1px] h-8 bg-[#CC293640]" />
            </div>
          </div>
        </ScrollReveal>

      </div>
    </SectionContainer>
  )
}
