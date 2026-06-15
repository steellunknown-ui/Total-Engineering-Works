'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * HeroVisual — Right-side video panel.
 *
 * Video: /videos/hero-loop.mp4 — Veo 3 generated CNC cinematic loop.
 * Autoplay · Muted · Loop · No controls (browser policy compliant).
 *
 * Layers (bottom → top):
 *  1. <video> — fills panel, object-cover
 *  2. Left-edge gradient — seamless blend into headline copy
 *  3. Bottom-edge gradient — blends into trust strip
 *  4. Top-edge gradient — soft fade at navbar boundary
 *  5. Precision annotation — bottom-right corner
 *  6. Engineering bracket markers — top-right corner
 */
export function HeroVisual() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Attempt autoplay — muted is required for autoplay policy
    video.muted = true
    video.play().catch(() => {
      // Autoplay blocked (very rare on muted) — video will still render
    })
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg-void">

      {/* ── Video with Feathered Mask ────────────────────────────── */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'destination-in'
        }}
      >
        <video
          ref={videoRef}
          src="/videos/hero-loop.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setIsLoaded(true)}
          className={`
            absolute inset-0 w-full h-full object-cover object-center
            transition-opacity duration-1000
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          aria-hidden="true"
        />
      </div>

      {/* Blueprint grid fallback — visible while video loads */}
      {!isLoaded && <HeroVisualFallback />}

      {/* ── Cinematic Gradient Blending Overlays ─────────────────── */}

      {/* Primary Left-edge Blend — Deep fade into content */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-full pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to right, var(--bg-void) 0%, var(--bg-void) 5%, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.4) 30%, transparent 50%)',
        }}
      />

      {/* Edge Haze / Glow — Softens the boundary further */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-32 pointer-events-none z-[2]"
        style={{
          background: 'linear-gradient(to right, var(--bg-void), transparent)',
          opacity: 0.8
        }}
      />

      {/* Bottom-edge — blends into trust strip */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to top, var(--bg-void) 0%, rgba(0,0,0,0.6) 20%, transparent 100%)',
        }}
      />

      {/* Top-edge — soft navbar boundary */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-void) 0%, transparent 100%)',
        }}
      />

      {/* ── Precision annotation — bottom right ───────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-6 right-6 flex flex-col items-end gap-1.5 z-10"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
          CNC Precision
        </span>
        <span
          className="font-mono text-[12px] tracking-[0.08em] font-medium"
          style={{ color: 'rgba(var(--accent-primary-rgb), 0.70)' }}
        >
          ±0.003mm
        </span>
      </div>

      {/* ── Engineering corner bracket markers ────────────────────── */}
      <div
        aria-hidden
        className="absolute top-6 right-6 h-7 w-7 border-t border-r border-white/10 z-10"
      />
      <div
        aria-hidden
        className="absolute bottom-6 left-6 h-7 w-7 border-b border-l border-white/10 z-10"
      />

    </div>
  )
}

/**
 * HeroVisualFallback — Blueprint grid.
 * Renders while video is loading or when video is unavailable.
 * Uses CSS custom properties so it re-colours with the active theme.
 */
export function HeroVisualFallback() {
  return (
    <div className="absolute inset-0 bg-bg-void">

      {/* Blueprint grid — CSS var driven so theme-aware */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid-fine" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(var(--accent-primary-rgb),0.06)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern id="grid-major" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
            <rect width="160" height="160" fill="url(#grid-fine)" />
            <path
              d="M 160 0 L 0 0 0 160"
              fill="none"
              stroke="rgba(var(--accent-primary-rgb),0.10)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-major)" />
      </svg>

      {/* Centre crosshair */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[120px] h-[120px]">
          <div className="absolute inset-0 rounded-full border border-accent-primary/10" />
          <div className="absolute inset-[28px] rounded-full border border-accent-primary/15" />
          <div className="absolute inset-[54px] rounded-full bg-accent-primary/20" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent-primary/15 -translate-y-px" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent-primary/15 -translate-x-px" />
          <div className="absolute top-0 left-1/2 h-3 w-px bg-accent-primary/30 -translate-x-px" />
          <div className="absolute bottom-0 left-1/2 h-3 w-px bg-accent-primary/30 -translate-x-px" />
          <div className="absolute left-0 top-1/2 w-3 h-px bg-accent-primary/30 -translate-y-px" />
          <div className="absolute right-0 top-1/2 w-3 h-px bg-accent-primary/30 -translate-y-px" />
        </div>
      </div>

      {/* Spec annotations */}
      <div aria-hidden className="absolute top-[20%] right-[15%] flex flex-col gap-1 text-right">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-primary/25">Tolerance</span>
        <span className="font-mono text-[12px] text-accent-primary/35 tracking-[0.08em]">±0.003 mm</span>
      </div>
      <div aria-hidden className="absolute bottom-[30%] left-[12%] flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted/40">Spindle</span>
        <span className="font-mono text-[12px] text-text-secondary/30 tracking-[0.06em]">12,000 RPM</span>
      </div>
      <div aria-hidden className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted/40">DMG MORI NHX 5000</span>
        <span className="font-mono text-[11px] text-accent-primary/30 tracking-[0.08em]">5-Axis CNC · ±0.003mm</span>
      </div>

      {/* Left fade */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, var(--bg-void) 0%, rgba(0,0,0,0.4) 30%, transparent 70%)' }}
      />
    </div>
  )
}
