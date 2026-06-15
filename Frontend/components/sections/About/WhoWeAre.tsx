'use client'

import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { StaggerContainer } from '@/components/motion/StaggerContainer'

import { GridBackground } from '@/components/ui/GridBackground'

export function WhoWeAre() {
  return (
    <section className="py-8 md:py-12 bg-bg-base border-b border-border-hairline overflow-hidden">
      <SectionContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* ── Left: Text Content ── */}
          <StaggerContainer className="flex flex-col gap-6">
            <FadeIn direction="up">
              <h2 className="font-sans font-bold text-display-xs md:text-display-sm text-text-primary tracking-[-0.02em]">
                Who We Are
              </h2>
            </FadeIn>
            
            <FadeIn direction="up">
              <div className="prose prose-invert max-w-none font-sans text-body-lg text-text-secondary leading-[1.7]">
                <p>
                  Tatva Dynamics Pvt Ltd is a Tandon Group Company specializing in Sheet Metal Fabrication, Stamping, Machining, Surface Treatment, Powder Coating and Wiring & Assemblies. Tatva Dynamics serves customers across Telecom, Energy, Automation, Healthcare and Defense Sectors, in India and Globally.
                </p>
                <p className="mt-6">
                  With a legacy spanning over two decades, Tatva Dynamics has established itself as a trusted partner for precision manufacturing solutions. Our expertise and commitment to excellence have made us a preferred choice for customers seeking reliable, high-quality components and assemblies.
                </p>
                <p className="mt-6">
                  At Tatva Dynamics, we believe that precision and reliability are not just specifications—they are commitments. Every component we manufacture undergoes rigorous quality control to ensure it meets the highest international standards, enabling our clients to succeed in their competitive markets.
                </p>
              </div>
            </FadeIn>
          </StaggerContainer>

          {/* ── Right: Image Bento Grid ── */}
          <StaggerContainer className="flex flex-col gap-4">
            
            {/* Top Large Image */}
            <FadeIn direction="left" delay={0.2}>
              <div className="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden bg-bg-surface border border-border-hairline group">
                <Image
                  src="/images/about-1.jpg"
                  alt="Tatva Dynamics Factory Exterior"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Fallback placeholder text in case image is missing */}
                <div className="absolute inset-0 flex items-center justify-center text-text-muted font-mono text-[11px] uppercase tracking-widest -z-10">
                  Image 1 Placeholder
                </div>
              </div>
            </FadeIn>

            {/* Bottom Row: 2 Small Images */}
            <div className="grid grid-cols-2 gap-4">
              <FadeIn direction="up" delay={0.4}>
                <div className="relative w-full h-[180px] sm:h-[220px] rounded-2xl overflow-hidden bg-bg-surface border border-border-hairline group">
                  <Image
                    src="/images/about-2.jpg"
                    alt="Welding Process"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted font-mono text-[11px] uppercase tracking-widest -z-10">
                    Image 2 Placeholder
                  </div>
                </div>
              </FadeIn>

              <FadeIn direction="up" delay={0.5}>
                <div className="relative w-full h-[180px] sm:h-[220px] rounded-2xl overflow-hidden bg-bg-surface border border-border-hairline group">
                  <Image
                    src="/images/about-3.jpg"
                    alt="AMADA Machine Operation"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted font-mono text-[11px] uppercase tracking-widest -z-10">
                    Image 3 Placeholder
                  </div>
                </div>
              </FadeIn>
            </div>

          </StaggerContainer>

        </div>
      </SectionContainer>
    </section>
  )
}
