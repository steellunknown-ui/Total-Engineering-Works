'use client'

import { useEffect, useRef, useState } from 'react'

/* ── Stat definitions ────────────────────────────────────────────────────── */
const heroStats = [
  {
    id:     'years',
    target: 25,
    suffix: '+',
    label:  'Years of Excellence',
    sub:    'Est. 1999 under Tandon Group',
  },
  {
    id:     'sectors',
    target: 5,
    suffix: '+',
    label:  'Industry Sectors',
    sub:    'Telecom · Energy · Defense · Healthcare · Automation',
  },
  {
    id:     'products',
    target: 500,
    suffix: '+',
    label:  'Products Delivered',
    sub:    'Across global OEM supply chains',
  },
] as const

/* ── useCountUp hook ─────────────────────────────────────────────────────── */
/**
 * Counts from 0 → target using requestAnimationFrame.
 * Uses an easeOutExpo curve so numbers race in fast then snap to final value.
 *
 * @param target   Final number to reach
 * @param duration Total animation time in ms (default 1400ms)
 * @param delay    Start delay in ms (default 0)
 */
function useCountUp(target: number, duration = 1400, delay = 0): number {
  const [value, setValue] = useState(0)
  const rafRef            = useRef<number | null>(null)
  const startRef          = useRef<number | null>(null)
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp
        const elapsed  = timestamp - startRef.current
        const progress = Math.min(elapsed / duration, 1)

        // easeOutExpo — rockets then gently settles
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setValue(Math.floor(eased * target))

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          setValue(target) // guarantee exact final value
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current)   cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return value
}

/* ── Individual counter cell ─────────────────────────────────────────────── */
function StatCounter({
  stat,
  delay,
}: {
  stat: (typeof heroStats)[number]
  delay: number
}) {
  const count = useCountUp(stat.target, 1400, delay)

  return (
    <div className="flex flex-col gap-1 group">

      {/* Number + suffix */}
      <div className="flex items-baseline gap-0.5">
        <span
          className="
            font-mono font-bold tabular-nums
            text-[36px] md:text-[40px] lg:text-[44px]
            leading-none tracking-[-0.03em]
            text-accent-primary
          "
          aria-live="polite"
          aria-atomic="true"
        >
          {count}
        </span>
        <span className="font-mono font-bold text-[28px] leading-none text-accent-primary/80">
          {stat.suffix}
        </span>
      </div>

      {/* Label */}
      <p className="font-sans text-[13px] font-semibold text-text-primary tracking-[-0.01em] leading-none">
        {stat.label}
      </p>

      {/* Sub-label */}
      <p className="font-mono text-[10px] text-text-muted tracking-[0.04em] leading-[1.4]">
        {stat.sub}
      </p>
    </div>
  )
}

/* ── Exported component ──────────────────────────────────────────────────── */
/**
 * HeroCounterBar — count-up stat strip for the Hero section.
 *
 * Fires on mount (page load), not on scroll.
 * Numbers race from 0 using easeOutExpo, each staggered 120ms apart.
 * Designed to sit below the CTA group inside the Hero left column.
 */
export function HeroCounterBar() {
  return (
    <div
      className="
        grid grid-cols-1 sm:grid-cols-3
        gap-x-12 gap-y-8
        pt-8 pb-10 border-t border-border-hairline
        w-full
      "
      aria-label="Company highlights"
    >
      {heroStats.map((stat, i) => (
        <StatCounter key={stat.id} stat={stat} delay={300 + i * 140} />
      ))}
    </div>
  )
}
