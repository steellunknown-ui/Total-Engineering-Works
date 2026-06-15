import {
  Wifi, Zap, Cpu, Activity, Shield,
  type LucideIcon,
} from 'lucide-react'
import { industries }          from '@/config/industries'
import type { IndustrySector } from '@/config/industries'
import { SectionContainer }    from '@/components/layout/SectionContainer'
import { FadeIn }              from '@/components/motion/FadeIn'
import { ScrollReveal }        from '@/components/motion/ScrollReveal'
import { cn }                  from '@/utils/cn'

/**
 * Industries — Five critical sectors Tatva Dynamics supplies.
 *
 * Design: 5 equal-width cards on desktop (3+2 on tablet, 1 on mobile).
 * Each card:
 *   - Top: sector index (01–05) + Lucide icon in accent color
 *   - Title (large, semibold)
 *   - Description
 *   - ── divider ──
 *   - Key supply tags (what we actually manufacture for this sector)
 *   - Client reference in micro mono
 *
 * Defense card gets a crimson left-border accent — highest-trust signal.
 * Server Component.
 */

const ICON_MAP: Record<string, LucideIcon> = {
  Wifi:     Wifi,
  Zap:      Zap,
  Cpu:      Cpu,
  Activity: Activity,
  Shield:   Shield,
}

function SectorCard({ sector }: { sector: IndustrySector }) {
  const Icon = ICON_MAP[sector.icon] ?? Shield

  return (
    <article
      className={cn(
        'group flex flex-col gap-0',
        'border border-border-hairline hover:border-border-default',
        'bg-bg-surface transition-colors duration-300 h-full',
        // Defense gets a left-border accent
        sector.isDefense && 'border-l-2 border-l-[#CC2936]',
      )}
    >
      {/* ── Top panel ─────────────────────────────────────────── */}
      <div className="p-7 flex flex-col gap-5 flex-1">

        {/* Index + Icon row */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-mono text-[11px] tracking-[0.18em] font-semibold',
              sector.isDefense ? 'text-[#CC2936]' : 'text-accent-primary',
            )}
          >
            {sector.index}
          </span>
          <Icon
            size={22}
            strokeWidth={1.5}
            className={cn(
              sector.isDefense ? 'text-[#CC2936]' : 'text-accent-primary',
              'opacity-80 group-hover:opacity-100 transition-opacity duration-300',
            )}
          />
        </div>

        {/* Sector title */}
        <h3 className="font-sans font-semibold text-[22px] md:text-[24px] text-text-primary tracking-[-0.02em] leading-none">
          {sector.title}
        </h3>

        {/* Description */}
        <p className="font-sans text-[13px] md:text-body text-text-secondary leading-[1.65] flex-1">
          {sector.description}
        </p>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="mx-7 h-px bg-border-hairline" />

      {/* ── Bottom panel: supply tags + client ─────────────────── */}
      <div className="p-7 flex flex-col gap-4">

        {/* Key supply label */}
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
          Key Supply
        </p>

        {/* Supply tags */}
        <div className="flex flex-wrap gap-1.5">
          {sector.keySupply.map((item) => (
            <span
              key={item}
              className={cn(
                'font-mono text-[9px] uppercase tracking-[0.10em] px-2.5 py-1',
                'border border-border-hairline',
                sector.isDefense
                  ? 'text-[#CC2936] border-[#CC293630]'
                  : 'text-accent-steel',
              )}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Client reference */}
        <p className="font-mono text-[10px] text-text-muted tracking-[0.06em] leading-none mt-1">
          {sector.clients}
        </p>
      </div>
    </article>
  )
}

export function Industries() {
  return (
    <SectionContainer
      background="surface"
      spacing="default"
      id="industries"
      className="border-b border-border-hairline"
    >
      <FadeIn>

        {/* Section header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
              Industries
            </p>
            <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
              Five sectors.<br className="hidden sm:block" /> One trusted supplier.
            </h2>
          </div>
          <p className="font-sans text-body text-text-secondary max-w-[42ch] leading-[1.65] md:text-right">
            From civilian telecom towers to classified defense platforms —
            Tatva Dynamics manufactures components where failure is not an option.
          </p>
        </div>

        {/* 5-card sector grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-4">
          {industries.map((sector, index) => (
            <ScrollReveal key={sector.id} delay={index * 0.08} className="h-full">
              <SectorCard sector={sector} />
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom credibility note */}
        <p className="mt-10 font-mono text-[11px] text-text-muted tracking-[0.06em]">
          Defense engagements are subject to non-disclosure agreements.
          Sector references available to qualified procurement contacts.
        </p>

      </FadeIn>
    </SectionContainer>
  )
}
