'use client'

import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FadeIn } from '@/components/motion/FadeIn'
import { StaggerContainer } from '@/components/motion/StaggerContainer'

import { GridBackground } from '@/components/ui/GridBackground'

const facilityImages = [
  { id: '1', title: 'Advanced CNC Machining', desc: 'Precision turning and milling centers running 24/7.' },
  { id: '2', title: 'Quality Assurance Lab', desc: 'Climate-controlled inspection facilities ensuring zero defects.' },
  { id: '3', title: 'Assembly & Integration', desc: 'Clean room environments for complex final assembly.' },
  { id: '4', title: 'Automated Logistics', desc: 'Smart inventory and dispatch systems for on-time delivery.' }
]

export function Facility() {
  return (
    <section className="py-8 md:py-12 bg-bg-void border-b border-border-hairline overflow-hidden">
      <SectionContainer>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
          <SectionHeading 
            label="Infrastructure"
            heading="Our Facility"
            subtitle="Explore our 50,000+ square foot state-of-the-art manufacturing floor, equipped with the latest technology to guarantee precision at scale."
            align="center"
          />
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {facilityImages.map((img, idx) => (
            <FadeIn key={idx} direction="up" delay={idx * 0.1} className="h-full">
              <div className="group relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden bg-bg-surface border border-border-default/50 shadow-2xl">
                
                {/* Fallback Text if image is missing */}
                <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/50 text-text-muted font-mono text-sm z-0">
                  Awaiting facility-{img.id}.jpg
                </div>

                {/* Image */}
                <Image
                  src={`/images/facility/facility-${img.id}.jpg`}
                  alt={img.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03] z-10"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Overlay Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-void/90 via-bg-void/20 to-transparent z-20 opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full transform md:translate-y-4 group-hover:translate-y-0 transition-transform duration-300 z-30 pointer-events-none">
                  <h4 className="font-sans font-bold text-xl md:text-2xl text-white mb-2 drop-shadow-md">
                    {img.title}
                  </h4>
                  <p className="font-sans text-sm md:text-base text-text-secondary opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 drop-shadow">
                    {img.desc}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </StaggerContainer>
      </SectionContainer>
    </section>
  )
}
