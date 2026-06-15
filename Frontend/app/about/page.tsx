import { Metadata } from 'next'
import Image from 'next/image'
import { GridBackground } from '@/components/ui/GridBackground'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { RFQSection } from '@/components/sections/RFQSection'

import { WhoWeAre } from '@/components/sections/About/WhoWeAre'
import { Founder } from '@/components/sections/About/Founder'
import { CoreValues } from '@/components/sections/About/CoreValues'
import { Timeline } from '@/components/sections/About/Timeline'
import { Infrastructure } from '@/components/sections/About/Infrastructure'
import { Facility } from '@/components/sections/About/Facility'

export const metadata: Metadata = {
  title: 'About Us | Total Engineering Works',
  description: 'A Tandon Group Company delivering precision manufacturing solutions since inception.',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ── About Hero Section ── */}
      <section className="relative overflow-hidden bg-bg-void border-b border-border-hairline pt-24 pb-8 md:pt-32 md:pb-10">
        
        {/* Background Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image 
            src="/images/about-hero-bg.png" 
            alt="Abstract Precision Metal Background"
            fill
            className="object-cover opacity-70 object-center"
            priority
          />
          {/* Gradient to ensure text readability on the left, fading to transparent on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-void via-bg-void/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-transparent to-transparent" />
        </div>
        
        <SectionContainer className="relative z-10 flex flex-col gap-6">
          <FadeIn direction="up" delay={0.1}>
            <h1 className="
              font-sans font-bold
              text-display-sm md:text-display-md lg:text-display
              text-text-primary
              tracking-[-0.03em] leading-tight
            ">
              About Total Engineering Works
            </h1>
          </FadeIn>
          
          <FadeIn direction="up" delay={0.2}>
            <p className="
              font-sans text-body-lg md:text-[22px]
              text-text-secondary
              max-w-3xl leading-[1.6] tracking-[-0.01em]
            ">
              A Tandon Group Company delivering precision manufacturing
              solutions since inception.
            </p>
          </FadeIn>
        </SectionContainer>
      </section>

      {/* ── Who We Are Section ── */}
      <WhoWeAre />

      {/* ── Founder Section ── */}
      <Founder />

      {/* ── Core Values (Vision) Section ── */}
      <CoreValues />

      {/* ── Heritage Timeline Section ── */}
      <Timeline />

      {/* ── Infrastructure & Global Footprint ── */}
      <Infrastructure />

      {/* ── Our Facility ── */}
      <Facility />

      {/* ── Global Call to Action ── */}
      <RFQSection />
    </div>
  )
}
