'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FadeIn } from '@/components/motion/FadeIn'
import { StaggerContainer } from '@/components/motion/StaggerContainer'
import { ShieldCheck, Cpu, Clock, Leaf } from 'lucide-react'
import Image from 'next/image'
import { GridBackground } from '@/components/ui/GridBackground'

const values = [
  {
    icon: ShieldCheck,
    title: 'Zero Defect Tolerance',
    description: 'Every component undergoes rigorous QC to ensure it meets the highest international standards without compromise.'
  },
  {
    icon: Cpu,
    title: 'Intelligent Engineering',
    description: "We don't just build to print. We solve complex manufacturing challenges to optimize for cost, speed, and durability."
  },
  {
    icon: Clock,
    title: 'Uncompromising Reliability',
    description: 'Delivering on time, every time. Global supply chains and critical infrastructure rely on our precision schedules.'
  },
  {
    icon: Leaf,
    title: 'Sustainable Innovation',
    description: 'Embracing advanced manufacturing technologies to reduce waste and carbon footprint while rapidly scaling production.'
  }
]

export function CoreValues() {
  return (
    <section className="relative py-8 md:py-12 bg-bg-void border-b border-border-hairline overflow-hidden">
      {/* Dynamic Grid Background */}
      <GridBackground />
      <div 
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse 800px 600px at 50% 50%, rgba(var(--accent-primary-rgb),0.08) 0%, transparent 70%)',
        }}
      />

      <SectionContainer className="relative z-10">
        <SectionHeading 
          label="Our Vision"
          heading="The Tatva Standard"
          subtitle="Precision and reliability are not just specifications—they are our core commitments to every client we serve."
          align="center"
          className="mb-8 max-w-2xl mx-auto"
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, idx) => (
            <FadeIn key={idx} direction="up" delay={idx * 0.1}>
              <div className="
                h-full flex flex-col items-start p-8
                rounded-2xl
                bg-bg-surface/40 backdrop-blur-xl border border-border-default/50
                hover:border-accent-primary/50 hover:bg-bg-surface/60
                transition-all duration-300
                group
              ">
                <div className="
                  w-12 h-12 rounded-lg flex items-center justify-center mb-6
                  bg-accent-primary/10 text-accent-primary
                  group-hover:scale-110 transition-transform duration-300
                ">
                  <value.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans font-bold text-lg text-text-primary mb-3">
                  {value.title}
                </h3>
                <p className="font-sans text-sm text-text-secondary leading-[1.6]">
                  {value.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </StaggerContainer>

        {/* Panoramic Vision Showcase Image */}
        <FadeIn direction="up" delay={0.4}>
          <div className="mt-8 md:mt-10 w-full relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl border border-border-default/50 group">
            <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-bg-void/20 to-transparent z-10 pointer-events-none" />
            <Image
              src="/images/facility-panorama.png"
              alt="Tatva Dynamics state-of-the-art precision manufacturing facility"
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-[10s] ease-out"
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
            {/* Overlay Text for Extra Fullness */}
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20">
              <p className="font-mono text-xs md:text-sm text-accent-primary uppercase tracking-[0.2em] mb-2">
                Facility Overview
              </p>
              <h4 className="font-sans font-bold text-xl md:text-3xl text-white drop-shadow-lg">
                50,000+ Sq Ft of Pure Precision
              </h4>
            </div>
          </div>
        </FadeIn>

      </SectionContainer>
    </section>
  )
}
