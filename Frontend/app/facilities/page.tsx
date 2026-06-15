'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import {
  Package, Scissors, GitMerge, Settings2,
  Flame, Droplets, PackageCheck,
  Shield, ArrowRight,
} from 'lucide-react'

import { SectionContainer }  from '@/components/layout/SectionContainer'
import { GridBackground }    from '@/components/ui/GridBackground'
import { Button }            from '@/components/ui/Button'
import {
  facilityStats,
  facilityGallery,
  facilityCategories,
  processSteps,
} from '@/config/facilitiesPage'
import { useImageLightbox } from '@/context/ImageLightboxContext'
import { useRFQModal } from '@/context/RFQModalContext'

// ─── Icon map for process steps ──────────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Package, Scissors, GitMerge, Settings2, Flame, Droplets, PackageCheck,
}

// ─── Reusable fade-up helper ─────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FacilitiesPage() {
  const { openModal } = useRFQModal()

  return (
    <div className="relative min-h-screen bg-bg-base overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO — Real image BG + dark gradient + cinematic type
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-bg-void border-b border-border-hairline pt-24 pb-8 md:pt-32 md:pb-10">

        {/* Background image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image
            src="/images/facility-panorama.png"
            alt="Total Engineering Works manufacturing facility"
            fill
            priority
            className="object-cover object-center opacity-50"
          />
          {/* Gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-void via-bg-void/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-transparent to-transparent" />
        </div>

        {/* Subtle accent radial glow */}
        <div
          aria-hidden
          className="absolute z-0 pointer-events-none"
          style={{
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 45% at 30% 55%, rgba(var(--accent-primary-rgb),0.10) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <SectionContainer spacing="none" className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5 max-w-3xl"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary">
              Advanced Manufacturing Infrastructure
            </p>

            <h1
              className="font-sans font-bold tracking-tight text-text-primary leading-tight"
              style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 1.0 }}
            >
              Manufacturing
              <br />
              <span className="text-text-muted">Facilities</span>
            </h1>

            <p className="font-sans text-body-lg text-text-secondary leading-[1.65] max-w-2xl">
              A vertically integrated production ecosystem — precision machining,
              automated sheet metal fabrication, and advanced surface treatment
              under one roof.
            </p>

            <div className="flex flex-wrap gap-8 mt-2 pt-6 border-t border-border-hairline">
              {[
                { value: '35,000', label: 'Sq.ft. Floor Area' },
                { value: '50+', label: 'CNC Machines' },
                { value: 'Triple', label: 'ISO Certified' },
                { value: '100%', label: 'In-House Build' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="font-mono font-bold text-xl text-text-primary">{item.value}</span>
                  <span className="font-sans text-[12px] text-text-muted uppercase tracking-[0.08em]">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </SectionContainer>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. QUICK STATS BAR
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-border-hairline bg-bg-void overflow-hidden">
        <GridBackground />
        <div className="relative z-10">
          <SectionContainer spacing="compact">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border-hairline">
              {facilityStats.map((stat, idx) => (
                <FadeUp key={stat.label} delay={idx * 0.08}>
                  <div className="flex flex-col gap-1.5 px-6 py-8 md:py-10 first:pl-0 last:pr-0">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono font-semibold text-text-primary"
                        style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', letterSpacing: '-0.03em' }}>
                        {stat.value}
                      </span>
                      {stat.unit && (
                        <span className="font-mono text-sm text-accent-steel">{stat.unit}</span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                      {stat.label}
                    </p>
                    <p className="font-sans text-[13px] text-text-secondary leading-snug">
                      {stat.sub}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </SectionContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. FACILITY GALLERY — Bento grid of floor photos
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-0 pb-8 md:pt-0 md:pb-12 border-b border-border-hairline">
        <SectionContainer>
          <FadeUp>
            <div className="mb-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-steel mb-3">
                Inside the Plant
              </p>
              <h2 className="font-sans font-semibold tracking-tight text-text-primary"
                style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.08 }}>
                35,000 sq.ft of Production&nbsp;
                <span className="text-text-muted">Capacity</span>
              </h2>
            </div>
          </FadeUp>

          {/* Bento grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[220px] md:auto-rows-[260px]">

            {/* Wide card — spans 2 cols */}
            <FadeUp delay={0}
              className="col-span-2 row-span-1 group relative overflow-hidden border border-border-hairline">
              <Image
                src={facilityGallery[0].src}
                alt={facilityGallery[0].caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <GalleryCaption text={facilityGallery[0].caption} />
            </FadeUp>

            {/* Tall card — spans 2 rows */}
            <FadeUp delay={0.1}
              className="col-span-1 row-span-2 group relative overflow-hidden border border-border-hairline">
              <Image
                src={facilityGallery[1].src}
                alt={facilityGallery[1].caption}
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <GalleryCaption text={facilityGallery[1].caption} />
            </FadeUp>

            {/* Normal cards */}
            <FadeUp delay={0.15}
              className="col-span-1 row-span-1 group relative overflow-hidden border border-border-hairline">
              <Image
                src={facilityGallery[2].src}
                alt={facilityGallery[2].caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <GalleryCaption text={facilityGallery[2].caption} />
            </FadeUp>

            <FadeUp delay={0.2}
              className="col-span-1 row-span-1 group relative overflow-hidden border border-border-hairline">
              <Image
                src={facilityGallery[3].src}
                alt={facilityGallery[3].caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <GalleryCaption text={facilityGallery[3].caption} />
            </FadeUp>
          </div>
        </SectionContainer>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. MACHINE CATEGORY SECTIONS — Electric grid bg + glowing cards
         ══════════════════════════════════════════════════════════════════ */}
      {facilityCategories.map((cat, catIdx) => (
        <section
          key={cat.id}
          className="relative pt-0 pb-8 md:pt-0 md:pb-12 border-b border-border-hairline overflow-hidden"
          style={{ background: catIdx % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-void)' }}
        >
          {/* Electric grid on odd sections for rhythm variation */}
          {catIdx % 2 !== 0 && <GridBackground />}

          {/* Accent radial glow top-center */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(var(--accent-primary-rgb),0.04) 0%, transparent 65%)',
            }}
          />

          <SectionContainer className="relative z-10">
            <div className="grid lg:grid-cols-[340px_1fr] gap-12 lg:gap-20 items-start">

              {/* Left: sticky category label */}
              <FadeUp className="lg:sticky lg:top-32">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-primary mb-3">
                  {cat.eyebrow}
                </p>
                <h2
                  className="font-sans font-semibold text-text-primary tracking-tight mb-5"
                  style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', lineHeight: 1.1 }}
                >
                  {cat.title}
                </h2>
                <p className="font-sans text-[15px] leading-[1.7] text-text-secondary max-w-sm">
                  {cat.description}
                </p>

                {/* Technical Sidebar Content for CNC Machining */}
                {cat.id === 'cnc-machining' && (
                  <div className="mt-10 flex flex-col gap-8 max-w-sm">
                    <div className="flex flex-col gap-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-steel border-b border-border-hairline pb-2">
                        Machining Standards
                      </p>
                      <div className="grid gap-6">
                        {[
                          { 
                            label: 'Micron Precision', 
                            desc: 'High-speed 12,000 RPM spindles delivering micron-level repeatability and finish.' 
                          },
                          { 
                            label: '4-Axis Capability', 
                            desc: 'Advanced multi-axis machining for complex aerospace and medical-grade components.' 
                          }
                        ].map((item) => (
                          <div key={item.label} className="group/item">
                            <h4 className="font-sans text-[13px] font-bold text-text-primary mb-1.5 flex items-center gap-2">
                              <div className="w-1 h-1 bg-accent-primary" />
                              {item.label}
                            </h4>
                            <p className="font-sans text-[13px] text-text-secondary leading-[1.6]">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Sidebar Content for Punch Press & Bending */}
                {cat.id === 'punch-bending' && (
                  <div className="mt-10 flex flex-col gap-8 max-w-sm">
                    <div className="flex flex-col gap-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-steel border-b border-border-hairline pb-2">
                        Fabrication Standards
                      </p>
                      <div className="grid gap-6">
                        {[
                          { 
                            label: 'Precision Bending', 
                            desc: 'Multi-axis CNC bending with automated angle correction to ±0.1 mm accuracy.' 
                          },
                          { 
                            label: 'Brush Table Tech', 
                            desc: 'Full brush table punching for scratch-free processing of decorative and coated materials.' 
                          }
                        ].map((item) => (
                          <div key={item.label} className="group/item">
                            <h4 className="font-sans text-[13px] font-bold text-text-primary mb-1.5 flex items-center gap-2">
                              <div className="w-1 h-1 bg-accent-primary" />
                              {item.label}
                            </h4>
                            <p className="font-sans text-[13px] text-text-secondary leading-[1.6]">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Sidebar Content for Welding & Assembly */}
                {cat.id === 'welding' && (
                  <div className="mt-10 flex flex-col gap-8 max-w-sm">
                    <div className="flex flex-col gap-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-steel border-b border-border-hairline pb-2">
                        Assembly Standards
                      </p>
                      <div className="grid gap-6">
                        {[
                          { 
                            label: 'AWS Certified', 
                            desc: 'Structural and precision welding executed by AWS D1.1 certified technicians for aerospace standards.' 
                          },
                          { 
                            label: 'Modular Assembly', 
                            desc: 'Vertical integration including hardware insertion, wiring, and full modular chassis build.' 
                          }
                        ].map((item) => (
                          <div key={item.label} className="group/item">
                            <h4 className="font-sans text-[13px] font-bold text-text-primary mb-1.5 flex items-center gap-2">
                              <div className="w-1 h-1 bg-accent-primary" />
                              {item.label}
                            </h4>
                            <p className="font-sans text-[13px] text-text-secondary leading-[1.6]">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Sidebar Content for Surface Treatment */}
                {cat.id === 'surface-treatment' && (
                  <div className="mt-10 flex flex-col gap-8 max-w-sm">
                    <div className="flex flex-col gap-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-steel border-b border-border-hairline pb-2">
                        Engineering Standards
                      </p>
                      <div className="grid gap-6">
                        {[
                          { 
                            label: 'RAL Precision', 
                            desc: 'Automated color matching ensuring consistent finish across high-volume production batches.' 
                          },
                          { 
                            label: '7-Tank Process', 
                            desc: 'Multi-stage chemical pre-treatment for maximum adhesion and superior corrosion resistance.' 
                          },
                          { 
                            label: 'Quality Control', 
                            desc: 'Standardized salt-spray and cross-cut adhesion testing for mission-critical components.' 
                          }
                        ].map((item) => (
                          <div key={item.label} className="group/item">
                            <h4 className="font-sans text-[13px] font-bold text-text-primary mb-1.5 flex items-center gap-2">
                              <div className="w-1 h-1 bg-accent-primary" />
                              {item.label}
                            </h4>
                            <p className="font-sans text-[13px] text-text-secondary leading-[1.6]">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Capacity Metrics - "Something Different" */}
                      <div className="mt-6 p-5 border border-border-hairline bg-bg-surface/30 backdrop-blur-sm">
                        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent-primary mb-4">
                          Operational Capacity
                        </p>
                        <div className="flex flex-col gap-5">
                          {[
                            { label: 'Max Component Size', value: '2500 × 1500 mm' },
                            { label: 'Daily Throughput',   value: '1200+ Components' },
                            { label: 'Standard Lead-Time', value: '48 — 72 Hours' }
                          ].map((metric) => (
                            <div key={metric.label} className="flex flex-col gap-1">
                              <span className="font-sans text-[11px] text-text-muted uppercase tracking-wider">{metric.label}</span>
                              <span className="font-mono text-[14px] text-text-primary font-bold">{metric.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compliance & Certs - "Something Different" again */}
                      <div className="flex flex-col gap-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-steel border-b border-border-hairline pb-2">
                          Industry Compliance
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['RoHS', 'REACH', 'ASTM D3359', 'ISO 12944'].map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-bg-surface border border-border-hairline font-mono text-[9px] text-text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Quality Guarantee Seal */}
                      <div className="mt-2 flex items-center gap-4 p-4 border border-accent-primary/20 bg-accent-primary/5">
                        <div className="w-10 h-10 rounded-full border border-accent-primary/30 flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5 text-accent-primary" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-sans text-[12px] font-bold text-text-primary uppercase tracking-tight">Zero-Defect Guarantee</p>
                          <p className="font-sans text-[11px] text-text-secondary leading-tight">100% inspection on every batch.</p>
                        </div>
                      </div>

                      {/* Sustainability & Safety - The final piece */}
                      <div className="mt-2 flex flex-col gap-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-steel border-b border-border-hairline pb-2">
                          Safety & Sustainability
                        </p>
                        <div className="flex flex-col gap-2.5">
                           {[
                             { label: 'Energy',    value: 'High-Efficiency UV Curing' },
                             { label: 'Safety',    value: 'LTI-Free Facility' },
                             { label: 'Recycling', value: 'Zero-Discharge System' }
                           ].map(item => (
                             <div key={item.label} className="flex items-center justify-between">
                               <span className="font-sans text-[10px] text-text-muted uppercase tracking-wide">{item.label}</span>
                               <span className="font-sans text-[11px] text-text-primary font-medium text-right">{item.value}</span>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Technical Documentation - The absolute final piece */}
                      <div className="mt-6">
                        <button className="w-full flex items-center justify-between px-4 py-3 border border-border-hairline bg-bg-void hover:bg-accent-primary/5 hover:border-accent-primary/30 transition-all duration-300 group/btn">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-primary">View Process TDS</span>
                          <ArrowRight className="w-3.5 h-3.5 text-accent-primary group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vertical accent line */}
                <div className="hidden lg:block mt-8 w-px h-16 bg-gradient-to-b from-accent-primary/40 to-transparent" />
              </FadeUp>

              {/* Right: machine cards */}
              <div className={`grid gap-6 ${cat.id === 'surface-treatment' ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                {cat.items.map((machine, mIdx) => (
                  <FadeUp key={machine.id} delay={mIdx * 0.1}>
                    <MachineCard machine={machine} />
                  </FadeUp>
                ))}
              </div>
            </div>
          </SectionContainer>
        </section>
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          5. PROCESS FLOW — 7-step horizontal stepper
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-0 pb-8 md:pt-0 md:pb-12 border-b border-border-hairline bg-bg-void">
        <SectionContainer className="relative z-10">
          <FadeUp className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-steel mb-3">
                From Raw Stock to Delivery
              </p>
              <h2
                className="font-sans font-semibold text-text-primary tracking-tight"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.08 }}
              >
                Our Manufacturing{' '}
                <span className="text-text-muted">Process</span>
              </h2>
            </div>
            <div className="max-w-sm text-left md:text-right pb-2">
              <p className="font-sans text-[13px] md:text-[14px] text-text-secondary leading-[1.6]">
                An end-to-end, fully integrated production workflow engineered for speed, 
                absolute traceability, and zero-defect output at industrial scale.
              </p>
            </div>
          </FadeUp>

          {/* Step cards — horizontal scroll on mobile, grid on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 lg:gap-3 items-stretch">
            {processSteps.map((step, idx) => {
              const Icon = iconMap[step.icon] ?? Package
              return (
                <FadeUp key={step.id} delay={idx * 0.07} className="h-full">
                  <div className="relative group flex flex-col gap-4 p-5 border border-border-hairline bg-bg-surface/20 backdrop-blur-sm hover:border-accent-primary/40 hover:bg-bg-surface/40 transition-all duration-300 h-full">

                    {/* Connector line (desktop only, not last) */}
                    {idx < processSteps.length - 1 && (
                      <div className="hidden lg:block absolute right-0 top-[34px] translate-x-full w-full h-[1.5px] animate-pulse"
                        style={{ 
                          background: 'linear-gradient(to right, rgba(var(--accent-primary-rgb),0.6), rgba(var(--accent-primary-rgb),0.1))',
                          animationDelay: `${idx * 0.2}s`
                        }}
                        aria-hidden
                      />
                    )}

                    {/* Step number */}
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-text-muted">
                      {String(step.step).padStart(2, '0')}
                    </p>

                    {/* Icon */}
                    <div className="w-9 h-9 flex items-center justify-center border border-border-default bg-bg-elevated text-accent-primary group-hover:border-accent-primary/50 group-hover:shadow-[0_0_14px_rgba(var(--accent-primary-rgb),0.25)] transition-all duration-300">
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </div>

                    {/* Text */}
                    <div>
                      <p className="font-sans text-[13px] font-semibold text-text-primary leading-tight mb-1.5">
                        {step.title}
                      </p>
                      <p className="font-sans text-[12px] text-text-muted leading-[1.55]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              )
            })}
          </div>

          {/* ── Before / After Process Strip ── */}
          <FadeUp delay={0.15} className="mt-12 mb-6 border border-border-hairline bg-bg-surface/20 p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="relative w-16 h-16 md:w-20 md:h-20 border border-border-default bg-bg-surface shrink-0">
                 {/* Raw Stock Image placeholder */}
                 <Image src="/images/facility/raw-stock.png" alt="Raw Stock" fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.15em]">Phase 01</span>
                <span className="font-sans font-semibold text-text-primary text-[15px]">Raw Stock Material</span>
              </div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-10 relative h-20">
              {/* Thick glowing connecting line */}
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
              
              {/* Central Process Pill */}
              <div className="relative z-10 flex items-center gap-3 px-6 py-2.5 bg-bg-void border border-accent-primary/30 rounded-full shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.15)]">
                <Settings2 className="w-4 h-4 text-accent-primary animate-[spin_4s_linear_infinite]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-primary font-semibold">
                  5-Stage Precision Machining
                </span>
                <ArrowRight className="w-4 h-4 text-accent-primary" />
              </div>
            </div>
            
            {/* Mobile Arrow Connector */}
            <div className="flex md:hidden items-center justify-center py-2">
               <ArrowRight className="w-5 h-5 text-accent-primary/50 rotate-90" />
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto justify-end">
              <div className="flex flex-col gap-1 text-right">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.15em]">Phase 07</span>
                <span className="font-sans font-semibold text-text-primary text-[15px]">Finished Precision Part</span>
              </div>
              <div className="relative w-16 h-16 md:w-20 md:h-20 border border-accent-primary/50 bg-bg-surface shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.15)] shrink-0">
                 {/* Finished Part Image placeholder */}
                 <Image src="/images/facility/finished-part.png" alt="Finished Part" fill className="object-cover" />
              </div>
            </div>
          </FadeUp>

          {/* ── Panoramic floor image strip ── */}
          <FadeUp className="relative overflow-hidden border border-border-hairline" delay={0.2}>
            <div className="relative w-full" style={{ aspectRatio: '21/6' }}>
              <Image
                src="/images/facility/facility-floor-panorama.png"
                alt="Total Engineering Works manufacturing floor panorama"
                fill
                className="object-cover object-center"
              />
              {/* dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

              {/* Bottom caption bar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
                    Live Production Floor — Total Engineering Works, Pune
                  </p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                  35,000 sq.ft
                </p>
              </div>

              {/* Accent top hairline */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(var(--accent-primary-rgb),0.5), transparent)' }}
              />
            </div>
          </FadeUp>
        </SectionContainer>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. QUALITY STRIP — ISO trust block with CMM image
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-0 pb-8 md:pt-0 md:pb-12 border-b border-border-hairline bg-bg-base">
        <SectionContainer>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">

            {/* Left copy */}
            <FadeUp className="max-w-xl flex flex-col h-full justify-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-steel mb-3">
                  Quality Assurance
                </p>
                <h2
                  className="font-sans font-semibold text-text-primary tracking-tight mb-5"
                  style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', lineHeight: 1.05 }}
                >
                  Every component is{' '}
                  <span className="text-text-muted">inspected</span>
                </h2>
                <p className="font-sans text-[16px] text-text-secondary leading-[1.7] mb-8">
                  Triple ISO-certified manufacturing process with in-house CMM inspection,
                  full lot traceability, and a strict zero-defect delivery commitment on every order we ship.
                </p>

                {/* Stat row */}
                <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6 pb-6 border-b border-border-hairline">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono font-bold text-lg text-text-primary">0.003mm</span>
                    <span className="font-sans text-[10px] text-text-muted uppercase tracking-[0.06em]">Inspection Tolerance</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono font-bold text-lg text-text-primary">100%</span>
                    <span className="font-sans text-[10px] text-text-muted uppercase tracking-[0.06em]">Lot Traceability</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono font-bold text-lg text-text-primary">Zero</span>
                    <span className="font-sans text-[10px] text-text-muted uppercase tracking-[0.06em]">Defect Commitment</span>
                  </div>
                </div>
              </div>

              {/* Cert Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { code: 'ISO 9001:2015',  name: 'Quality Management'           },
                  { code: 'ISO 14001:2015', name: 'Environmental Management'      },
                  { code: 'ISO 45001:2018', name: 'Occupational H&S'             },
                  { code: 'DEFENSE',        name: 'Strategic Sector Cleared'      },
                ].map((cert) => (
                  <div key={cert.code} className="flex items-center gap-2.5 px-4 py-3 border border-border-default bg-bg-surface/30 h-full">
                    <Shield className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                    <div>
                      <p className="font-mono text-[10px] font-semibold text-text-primary tracking-[0.06em]">
                        {cert.code}
                      </p>
                      <p className="font-mono text-[9px] text-text-muted tracking-[0.04em]">
                        {cert.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Space-filling bold statement */}
              <div className="mt-8 pt-6 border-t border-border-hairline">
                <p className="font-sans text-[16px] md:text-[18px] font-bold text-text-primary leading-tight">
                  ENGINEERED FOR PRECISION. DELIVERED WITH CONFIDENCE.
                </p>
              </div>
            </FadeUp>

            {/* Right — CMM Image */}
            <FadeUp delay={0.2} className="relative aspect-video lg:aspect-auto w-full border border-border-hairline overflow-hidden bg-bg-void h-full min-h-[400px]">
              <Image
                src="/images/facility/facility-3.jpg?v=2"
                alt="Total Engineering Works CMM Quality Inspection"
                fill
                className="object-cover transition-transform duration-1000 hover:scale-105"
              />
              {/* Subtle edge vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </FadeUp>

          </div>
        </SectionContainer>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          7. SCHEDULE A VISIT — Compact orange CTA (matches Products page)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-border-hairline bg-accent-primary py-16 md:py-20">
        <SectionContainer spacing="none">
          <FadeUp>
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-[62ch] flex-col gap-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/75">
                  Facility Open for Audit Visits
                </p>
                <h2 className="font-sans text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-white md:text-[48px]">
                  Schedule a facility tour.<br />
                  <span className="text-white/60">See the plant firsthand.</span>
                </h2>
                <p className="font-sans text-[16px] leading-[1.75] text-white/80">
                  Visit our plant to audit our processes, inspect infrastructure,
                  and validate us as your long-term manufacturing partner.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  className="bg-bg-void text-text-primary hover:bg-bg-base"
                  onClick={() => openModal('visit')}
                >
                  Book a Visit
                </Button>
                <Button
                  variant="secondary"
                  className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
                  onClick={() => openModal('rfq')}
                >
                  Request a Quote
                </Button>
              </div>
            </div>
          </FadeUp>
        </SectionContainer>
      </section>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GalleryCaption({ text }: { text: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
        {text}
      </p>
    </div>
  )
}

function MachineCard({
  machine,
}: {
  machine: {
    id: string
    title: string
    manufacturer?: string
    model?: string
    description: string
    specs: { label: string; value: string }[]
    image: string
  }
}) {
  const { openLightbox } = useImageLightbox()

  return (
    <article className="group relative flex flex-col h-full border border-border-hairline bg-bg-surface/20 backdrop-blur-sm overflow-hidden hover:border-accent-primary/40 hover:shadow-[0_0_30px_rgba(var(--accent-primary-rgb),0.12)] transition-all duration-400">

      {/* Image */}
      <div 
        className="relative aspect-[16/10] overflow-hidden bg-bg-void shrink-0 cursor-zoom-in group/visual"
        onClick={() => openLightbox({
          src: machine.image,
          alt: machine.title,
          title: machine.title
        })}
      >
        <Image
          src={machine.image}
          alt={machine.title}
          fill
          className="object-cover transition-transform duration-700 group-hover/visual:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Electric shimmer on hover — top edge glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Manufacturer badge */}
        {machine.manufacturer && (
          <div className="absolute top-4 left-4 border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md z-10">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white">
              {machine.manufacturer}
            </p>
          </div>
        )}

        {/* Technical Schematic Map Overlay (A-B-C-D) */}
        <div className="absolute left-5 bottom-5 flex flex-col gap-2.5 pointer-events-none z-10 opacity-50 group-hover/visual:opacity-100 transition-opacity duration-500">
          {/* Top Label */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent-primary animate-pulse" />
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/70">
              SYS_NODE: {machine.id.split('-')[0].toUpperCase()}-0{machine.title.length % 9 + 1}
            </p>
          </div>
          
          {/* Map Sequence A-B-C-D */}
          <div className="flex items-center gap-2">
            {['A', 'B', 'C', 'D'].map((node, idx) => {
              const isActive = (machine.title.length + idx) % 4 === 0;
              return (
                <React.Fragment key={node}>
                  <div className={`flex items-center justify-center w-4 h-4 border transition-all duration-300 backdrop-blur-sm text-[8px] font-mono ${
                    isActive 
                      ? 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.2)]' 
                      : 'border-white/30 bg-black/40 text-white'
                  }`}>
                    {node}
                  </div>
                  {idx < 3 && (
                    <div className="w-4 h-px bg-white/20 relative">
                      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-accent-primary shadow-[0_0_6px_rgba(var(--accent-primary-rgb),0.8)]' : 'bg-white/40'
                      }`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 p-6 flex-1">
        <div className="flex flex-col">
          <h3 className="font-sans text-[19px] font-semibold text-text-primary tracking-tight mb-1.5">
            {machine.title}
          </h3>
          {machine.model && (
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary mb-3">
              {machine.model}
            </p>
          )}
          <p className="font-sans text-[13px] leading-[1.65] text-text-secondary">
            {machine.description}
          </p>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-5 border-t border-border-hairline mt-auto">
          {machine.specs.map((spec) => (
            <div key={spec.label}>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted mb-1">
                {spec.label}
              </p>
              <p className="font-sans text-[13px] font-semibold text-text-primary">
                {spec.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom accent line — slides in on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
    </article>
  )
}
