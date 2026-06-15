'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FadeIn } from '@/components/motion/FadeIn'
import { StaggerContainer } from '@/components/motion/StaggerContainer'
import Image from 'next/image'

const milestones = [
  {
    year: '1970s',
    title: 'Tandon Corporation Era',
    description: 'Pioneered disk drive manufacturing and became the world’s largest independent producer of disk drives for personal computers.'
  },
  {
    year: '1978',
    title: 'The First Floppy Drives',
    description: 'Played a pivotal role in the development of the first floppy drives, shaping the early personal computing landscape.'
  },
  {
    year: '1999',
    title: 'Inception of Tatva Dynamics',
    description: 'Founded to deliver uncompromising precision manufacturing solutions, leveraging decades of high-tech engineering expertise.'
  },
  {
    year: 'Present',
    title: 'Global Operations',
    description: 'Operating at the forefront of precision manufacturing across India and North America, serving Telecom, Energy, Defense, and Healthcare.'
  }
]

import { GridBackground } from '@/components/ui/GridBackground'

export function Timeline() {
  return (
    <section className="py-8 md:py-12 bg-bg-base border-b border-border-hairline overflow-hidden">
      <SectionContainer>
        {/* Overarching Section Heading to fill the empty top space */}
        <div className="mb-8 md:mb-10 max-w-3xl mx-auto">
          <SectionHeading 
            label="Our Journey"
            heading="Five Decades of Evolution"
            subtitle="Tracing our path from the early days of personal computing to becoming a global leader in precision engineering."
            align="center"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
          
          {/* Left: Sticky Heading */}
          <div className="lg:sticky lg:top-32 h-fit flex flex-col gap-10">
            <SectionHeading 
              label="Heritage"
              heading="A Legacy of Engineering"
              subtitle="Our foundation is built on five decades of pioneering technology and defining international manufacturing standards."
            />
            
            <FadeIn direction="up" className="hidden lg:block">
              <div className="relative aspect-[4/3] w-[90%] rounded-2xl overflow-hidden bg-bg-surface border border-border-default/50 shadow-2xl group">
                <Image
                  src="/images/heritage-timeline.png"
                  alt="Vintage precision engineering component"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 to-transparent pointer-events-none" />
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.2} className="hidden lg:block">
              <div className="relative aspect-[4/3] w-[90%] rounded-2xl overflow-hidden bg-bg-surface border border-border-default/50 shadow-2xl group">
                <Image
                  src="/images/modern-timeline.png"
                  alt="Modern state-of-the-art global manufacturing operations"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 to-transparent pointer-events-none" />
              </div>
            </FadeIn>
          </div>

          {/* Right: Vertical Timeline */}
          <StaggerContainer className="relative">
            {/* The Vertical Line */}
            <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-border-default/50 md:left-6" />

            <div className="flex flex-col gap-12">
              {milestones.map((milestone, idx) => (
                <FadeIn key={idx} direction="up" delay={idx * 0.1} className="relative pl-12 md:pl-16">
                  
                  {/* The Dot */}
                  <div className="absolute left-[11px] md:left-[19px] top-1.5 w-[10px] h-[10px] rounded-full bg-accent-primary ring-4 ring-bg-base shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.5)]" />
                  
                  {/* Content */}
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-sm md:text-base font-bold text-accent-primary tracking-widest">
                      {milestone.year}
                    </span>
                    <h3 className="font-sans font-bold text-xl md:text-2xl text-text-primary">
                      {milestone.title}
                    </h3>
                    <p className="font-sans text-body-lg text-text-secondary leading-[1.6]">
                      {milestone.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </StaggerContainer>

        </div>
      </SectionContainer>
    </section>
  )
}
