'use client'

import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FadeIn } from '@/components/motion/FadeIn'
import { StaggerContainer } from '@/components/motion/StaggerContainer'

import { GridBackground } from '@/components/ui/GridBackground'

const chips = [
  '50+ Years in Technology',
  'Pioneer in EMS Industry',
  'Global Operations',
  'India & North America',
  'Amazon Best-Selling Author'
]

export function Founder() {
  return (
    <section className="py-8 md:py-12 bg-bg-void border-b border-border-hairline overflow-hidden">
      <SectionContainer>
        
        {/* Section Heading */}
        <SectionHeading 
          label="Leadership"
          heading={
            <>
              The Visionary Behind <span className="text-accent-primary">Tandon Group</span>
            </>
          }
          className="mb-8"
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left: Founder Image & Quote */}
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-8">
            <FadeIn direction="right">
              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-bg-surface border border-border-default/50 shadow-2xl">
                <Image
                  src="/images/founderML.jpg"
                  alt="Mr. Manohar Lal Tandon"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 400px"
                  priority
                />
              </div>
            </FadeIn>

            {/* Founder's Vision Quote */}
            <FadeIn direction="up" delay={0.2} className="flex-1 flex flex-col">
              <div className="relative p-8 rounded-2xl bg-bg-surface/30 backdrop-blur-sm border border-border-default/30 flex-1 flex flex-col justify-center">
                <div className="absolute -top-6 -left-2 text-[100px] leading-none text-accent-primary/20 font-serif font-bold pointer-events-none select-none">
                  &ldquo;
                </div>
                <h4 className="relative z-10 font-sans font-bold text-xl md:text-2xl text-text-primary mb-4 leading-[1.3]">
                  We don&apos;t just manufacture parts; we engineer reliability.
                </h4>
                <p className="relative z-10 font-sans text-text-secondary text-sm md:text-base leading-relaxed">
                  Every component we ship carries a fifty-year legacy of uncompromising quality and a commitment to pushing the boundaries of what is possible in precision engineering.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Right: Text Content */}
          <StaggerContainer className="flex-1 flex flex-col gap-8 justify-center">
            
            {/* Name & Title */}
            <FadeIn direction="up">
              <div>
                <h3 className="font-sans font-bold text-display-xs text-text-primary mb-2">
                  Mr. Manohar Lal Tandon
                </h3>
                <p className="font-mono text-sm uppercase tracking-[0.1em] text-accent-primary">
                  Chairman & Founder, Tandon Group
                </p>
              </div>
            </FadeIn>

            {/* Biography */}
            <FadeIn direction="up">
              <div className="prose prose-invert max-w-none font-sans text-body-lg text-text-secondary leading-[1.75] space-y-6">
                <p>
                  Mr. Manohar Lal (M.L.) Tandon is a pioneering entrepreneur whose five-decade career has shaped the global technology and manufacturing landscape. From the early days of punch cards and floppy discs to today's advanced electronics manufacturing, Mr. Tandon has been at the heart of the tech industry's evolution.
                </p>
                <p>
                  In the late 1970s and 1980s, Mr. Tandon led disk drive manufacturing operations for Tandon Corporation in India, which became the world's largest independent producer of disk drives for personal computers. He played a pivotal role in creating India's electronic manufacturing services (EMS) export industry and had a direct hand in the development of the first floppy drives in 1978.
                </p>
                <p>
                  Today, Tandon Group incubates promising startup companies and operates successful businesses across India and North America. The companies Tandon Group fosters solve significant problems in industries such as IT, healthcare, financial services, and e-commerce. Under Mr. Tandon's leadership, the group continues to drive innovation and transformation across multiple sectors.
                </p>
              </div>
            </FadeIn>

            {/* Chips */}
            <FadeIn direction="up">
              <div className="flex flex-wrap gap-3 mt-4">
                {chips.map((chip) => (
                  <div 
                    key={chip}
                    className="px-4 py-2 rounded-full border border-accent-primary/20 bg-accent-primary/5 text-accent-primary text-sm font-medium"
                  >
                    {chip}
                  </div>
                ))}
              </div>
            </FadeIn>

          </StaggerContainer>

        </div>
      </SectionContainer>
    </section>
  )
}
