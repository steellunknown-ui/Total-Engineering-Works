'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FadeIn } from '@/components/motion/FadeIn'
import { StaggerContainer } from '@/components/motion/StaggerContainer'
import { MapPin, Box, Award, Shield } from 'lucide-react'
import Image from 'next/image'
import { GridBackground } from '@/components/ui/GridBackground'

const stats = [
  {
    icon: Box,
    value: '50,000+',
    label: 'Sq Ft Facility',
    subtext: 'State-of-the-art manufacturing space'
  },
  {
    icon: MapPin,
    value: '2',
    label: 'Global Hubs',
    subtext: 'Operations in India & North America'
  },
  {
    icon: Shield,
    value: '3',
    label: 'ISO Standards',
    subtext: '9001, 14001, 45001 Certified'
  },
  {
    icon: Award,
    value: 'Zero',
    label: 'Defect Goal',
    subtext: 'In-house precision testing labs'
  }
]

export function Infrastructure() {
  return (
    <section className="relative py-8 md:py-12 bg-bg-void border-b border-border-hairline overflow-hidden">
      {/* Dynamic Grid Background */}
      <GridBackground />
      <div 
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse 900px 700px at 50% 50%, rgba(var(--accent-primary-rgb),0.05) 0%, transparent 70%)',
        }}
      />

      <SectionContainer className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
          <SectionHeading 
            label="Global Footprint"
            heading="Industrial Scale Capacity"
            subtitle="Our infrastructure is designed to handle enterprise-level contracts, seamlessly scaling from rapid prototyping to high-volume production."
            align="center"
          />
        </div>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <FadeIn key={idx} direction="up" delay={idx * 0.1}>
              <div className="
                flex flex-col items-center text-center p-8 h-full
                rounded-2xl border border-border-default/50 bg-bg-surface/30 backdrop-blur-sm
              ">
                <div className="
                  w-14 h-14 rounded-full flex items-center justify-center mb-6
                  bg-bg-elevated border border-border-default text-accent-primary
                ">
                  <stat.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                
                <h3 className="font-mono text-3xl md:text-4xl font-bold text-text-primary mb-2">
                  {stat.value}
                </h3>
                <p className="font-sans font-bold text-text-primary mb-2">
                  {stat.label}
                </p>
                <p className="font-sans text-sm text-text-muted leading-[1.6]">
                  {stat.subtext}
                </p>
              </div>
            </FadeIn>
          ))}
        </StaggerContainer>

        {/* Certificates Grid */}
        <div className="mt-8">
          <SectionHeading 
            heading="Certified Excellence"
            subtitle="Our manufacturing processes adhere strictly to global quality and environmental standards."
            align="center"
            className="mb-12"
          />
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                id: 'iso-9001',
                title: 'ISO 9001:2015',
                subtitle: 'Quality Management System',
              },
              {
                id: 'iso-14001',
                title: 'ISO 14001:2015',
                subtitle: 'Environmental Management',
              },
              {
                id: 'iso-45001',
                title: 'ISO 45001:2018',
                subtitle: 'Occupational Health & Safety',
              }
            ].map((cert, idx) => (
              <FadeIn key={idx} direction="up" delay={idx * 0.1} className="flex flex-col gap-4">
                
                {/* Header Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface/50 backdrop-blur-sm border border-border-default/50 hover:border-accent-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0 border border-accent-primary/20">
                    <Shield className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-text-primary text-base leading-tight">
                      {cert.title}
                    </h4>
                    <p className="font-sans text-sm text-text-muted mt-0.5">
                      {cert.subtitle}
                    </p>
                  </div>
                </div>

                {/* Certificate Image Card */}
                <div className="
                  relative aspect-[3/4] w-full rounded-xl overflow-hidden
                  bg-white flex flex-col items-center p-6
                  border border-border-default/50 shadow-2xl
                  group hover:border-accent-primary/50 transition-colors duration-300
                ">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="font-mono text-sm uppercase tracking-wider">Awaiting {cert.id}.png</span>
                  </div>
                  
                  <div className="relative w-full flex-1 mb-4 z-10">
                    <Image
                      src={`/images/certs/${cert.id}.png`}
                      alt={`${cert.title} Certificate`}
                      fill
                      className="object-contain drop-shadow-sm"
                    />
                  </div>
                  <div className="font-sans font-bold text-gray-900 text-center w-full pt-4 border-t border-gray-200 z-10">
                    {cert.title}
                  </div>
                </div>

              </FadeIn>
            ))}
          </StaggerContainer>
        </div>
      </SectionContainer>
    </section>
  )
}
