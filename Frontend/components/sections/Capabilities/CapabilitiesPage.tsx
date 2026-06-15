'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { GridBackground } from '@/components/ui/GridBackground'
import { useRFQModal } from '@/context/RFQModalContext'
import { capabilitySections, type CapabilitySection, type SubProcess } from '@/config/capabilitiesPage'
import { cn } from '@/utils/cn'

// ─── Sub-Process Card ─────────────────────────────────────────────────────────
function SubProcessCard({ sub, index }: { sub: SubProcess; index: number }) {
  return (
    <FadeIn delay={index * 0.08} className="h-full">
      <div className="group flex flex-col bg-bg-surface/40 border border-border-hairline hover:border-border-default transition-colors duration-300 overflow-hidden h-full">
        
        {/* Image — only if available */}
        {sub.image && (
          <div className="relative overflow-hidden" style={{ height: '180px' }}>
            <Image
              src={sub.image}
              alt={sub.title}
              fill
              className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, var(--bg-surface) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-3 p-6 flex-1">
          <h4 className="font-sans font-semibold text-[15px] text-text-primary leading-[1.3] tracking-[-0.01em]">
            {sub.title}
          </h4>
          <p className="font-sans text-[13px] text-text-secondary leading-[1.65] flex-1">
            {sub.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {sub.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-[0.10em] text-accent-steel border border-border-hairline px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

// ─── Single Capability Chapter ────────────────────────────────────────────────
function CapabilityChapter({ cap }: { cap: CapabilitySection }) {
  return (
    <section
      id={cap.id}
      className="border-b border-border-hairline py-10 md:py-14"
    >
      <SectionContainer spacing="none">
        {/* ── Chapter Header ── */}
        <FadeIn>
          <div className="flex flex-col gap-3 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary">
              {cap.index} / 06 — {cap.title}
            </p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="font-sans font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-[-0.03em] leading-[1.06]">
                {cap.title}
              </h2>
              <p className="font-sans text-[14px] text-text-secondary leading-[1.65] max-w-lg md:text-right">
                {cap.description}
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── Hero Image ── */}
        <FadeIn delay={0.1}>
          <div className="relative w-full overflow-hidden mb-6" style={{ height: '340px' }}>
            <Image
              src={cap.heroImage}
              alt={cap.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority={cap.index === '01'}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 50%), linear-gradient(to top, var(--bg-base) 0%, transparent 40%)',
              }}
            />
          </div>
        </FadeIn>

        {/* ── Sub-Process Cards Grid ── */}
        <div className={`grid gap-px bg-border-hairline ${
          cap.subProcesses.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {cap.subProcesses.map((sub, idx) => (
            <div key={sub.id} className="bg-bg-base h-full">
              <SubProcessCard sub={sub} index={idx} />
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}

// ─── Page Sticky Nav (slider with active state) ──────────────────────────────
function CapabilityNav({ activeId }: { activeId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the nav to keep active pill in view
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const activeEl = container.querySelector<HTMLElement>(`[data-cap-id="${activeId}"]`)
    if (!activeEl) return
    const { offsetLeft, offsetWidth } = activeEl
    const { offsetWidth: containerWidth, scrollLeft } = container
    const targetScroll = offsetLeft - containerWidth / 2 + offsetWidth / 2
    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [activeId])

  return (
    <div className="sticky top-[64px] z-30 bg-bg-void/95 backdrop-blur border-b border-border-hairline hidden md:block">
      <SectionContainer spacing="none">
        <div
          ref={scrollRef}
          className="flex items-stretch overflow-x-auto scrollbar-none"
        >
          {capabilitySections.map((cap) => {
            const isActive = activeId === cap.id
            return (
              <a
                key={cap.id}
                data-cap-id={cap.id}
                href={`#${cap.id}`}
                className={cn(
                  'relative flex-shrink-0 flex flex-col items-center justify-center gap-0.5',
                  'px-6 py-3 border-r border-border-hairline last:border-r-0',
                  'transition-colors duration-300 group whitespace-nowrap',
                  isActive
                    ? 'bg-accent-primary/10'
                    : 'hover:bg-white/[0.03]',
                )}
              >
                {/* Index */}
                <span
                  className={cn(
                    'font-mono text-[9px] tracking-[0.18em] transition-colors duration-300',
                    isActive ? 'text-accent-primary' : 'text-text-muted/60 group-hover:text-text-muted',
                  )}
                >
                  {cap.index}
                </span>
                {/* Title */}
                <span
                  className={cn(
                    'font-mono text-[10px] uppercase tracking-[0.12em] font-medium transition-colors duration-300',
                    isActive ? 'text-white' : 'text-text-secondary/70 group-hover:text-text-secondary',
                  )}
                >
                  {cap.title}
                </span>
                {/* Active indicator bar */}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300',
                    isActive ? 'bg-accent-primary opacity-100' : 'bg-transparent opacity-0',
                  )}
                />
              </a>
            )
          })}
        </div>
      </SectionContainer>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function CapabilitiesPage() {
  const [activeId, setActiveId] = useState(capabilitySections[0].id)
  const { openModal } = useRFQModal()

  // Track which capability section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )

    capabilitySections.forEach((cap) => {
      const el = document.getElementById(cap.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Page Hero ── */}
      <section className="relative overflow-hidden bg-bg-void border-b border-border-hairline pt-24 pb-8 md:pt-32 md:pb-10">
        
        {/* Background Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image 
            src="/images/capabilities-hero.png" 
            alt="Precision Manufacturing Capability Background"
            fill
            className="object-cover opacity-60 object-center"
            priority
          />
          {/* Gradient to ensure text readability on the left, fading to transparent on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-void via-bg-void/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-transparent to-transparent" />
        </div>

        <SectionContainer spacing="none" className="relative z-10">
          <FadeIn>
            <div className="flex flex-col gap-5 max-w-3xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary">
                What We Do
              </p>
              <h1 className="font-sans font-bold text-display-sm md:text-display-md text-text-primary tracking-[-0.03em] leading-tight">
                Manufacturing<br />Capabilities
              </h1>
              <p className="font-sans text-body-lg text-text-secondary leading-[1.65] max-w-2xl">
                Six core disciplines. One facility. Every process performed in-house — 
                from raw material intake to final quality sign-off, with full traceability at every step.
              </p>
              {/* Quick stats */}
              <div className="flex flex-wrap gap-8 mt-2 pt-6 border-t border-border-hairline">
                {[
                  { value: '6', label: 'Core Capabilities' },
                  { value: '50,000+', label: 'Sq Ft Facility' },
                  { value: '±0.003mm', label: 'Tightest Tolerance' },
                  { value: 'Zero', label: 'Subcontracted Processes' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <span className="font-mono font-bold text-xl text-text-primary">{stat.value}</span>
                    <span className="font-sans text-[12px] text-text-muted uppercase tracking-[0.08em]">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </SectionContainer>
      </section>

      {/* ── Sticky Nav ── */}
      <CapabilityNav activeId={activeId} />

      {/* ── Capability Chapters ── */}
      <div className="bg-bg-base">
        {capabilitySections.map((cap) => (
          <CapabilityChapter key={cap.id} cap={cap} />
        ))}
      </div>

      {/* ── CTA ── */}
      <section className="py-16 md:py-20 bg-accent-primary">
        <SectionContainer spacing="none">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex flex-col gap-3">
                <h2 className="font-sans font-bold text-2xl md:text-3xl text-white tracking-[-0.02em]">
                  Need Custom Manufacturing Solutions?
                </h2>
                <p className="font-sans text-white/80 text-[15px] leading-[1.6] max-w-xl">
                  Send us your drawings and we'll respond with a detailed capability assessment and lead time estimate within 24 hours.
                </p>
              </div>
              <button
                onClick={() => openModal('rfq')}
                className="flex-shrink-0 inline-flex items-center gap-2 bg-bg-void text-text-primary font-sans font-semibold text-[14px] tracking-[-0.01em] px-8 py-4 hover:bg-bg-base transition-colors duration-200"
              >
                Request a Quote
              </button>
            </div>
          </FadeIn>
        </SectionContainer>
      </section>

    </div>
  )
}
