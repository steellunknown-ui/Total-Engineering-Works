'use client'

import { useRef, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'

/**
 * GridBackground — Animated electrical-pulse grid.
 *
 * Renders a subtle dim grid with glowing pulses that travel along
 * grid lines — like electrical current running through a circuit board.
 *
 * Design behaviour:
 *  - Static grid at ~5% accent opacity (barely visible)
 *  - Pulses spawn randomly on H or V lines
 *  - Each pulse: bright glowing head dot + comet-like fading trail
 *  - Speed varies per pulse (150–450 px/s)
 *  - Theme-aware: reads --accent-primary-rgb from CSS vars automatically
 *
 * Usage:
 *  Place as the FIRST child of any `relative overflow-hidden` container.
 *  It fills the container via `absolute inset-0`.
 */

const CELL        = 52   // grid cell size in px
const MAX_PULSES  = 8    // max concurrent pulses
const TRAIL_CELLS = 5    // comet trail length in cells

interface Pulse {
  axis:      'h' | 'v'
  lineIndex: number       // which grid line (row or col index)
  pos:       number       // current head position in px
  speed:     number       // px per second
  alpha:     number       // max opacity 0–1
}

export function GridBackground() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const pulses     = useRef<Pulse[]>([])
  const rafRef     = useRef<number>(0)
  const lastTs     = useRef<number>(0)
  const spawnTimer = useRef<number>(0)
  const { theme }  = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let cols = 0
    let rows = 0

    // ── Size canvas to parent ──────────────────────────────────────────
    const resize = () => {
      const rect = parent.getBoundingClientRect()
      W = canvas.width  = Math.round(rect.width  || parent.offsetWidth)
      H = canvas.height = Math.round(rect.height || parent.offsetHeight)
      cols = Math.ceil(W / CELL) + 1
      rows = Math.ceil(H / CELL) + 1
    }

    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    // ── Read theme accent colour from CSS var ──────────────────────────
    const getRgb = (): string =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-primary-rgb')
        .trim() || '0,122,255'

    // ── Spawn a new pulse ──────────────────────────────────────────────
    const spawn = () => {
      if (pulses.current.length >= MAX_PULSES) return
      const axis      = Math.random() > 0.5 ? 'h' : 'v'
      const maxIndex  = axis === 'h' ? rows : cols
      pulses.current.push({
        axis,
        lineIndex: Math.floor(Math.random() * maxIndex),
        pos:   0,
        speed: 150 + Math.random() * 300,   // 150–450 px/s
        alpha: 0.55 + Math.random() * 0.45, // 0.55–1.0
      })
    }

    // ── Main animation loop ────────────────────────────────────────────
    const draw = (ts: number) => {
      const dt = Math.min((ts - lastTs.current) / 1000, 0.05) // capped at 50ms
      lastTs.current = ts

      ctx.clearRect(0, 0, W, H)

      const rgb = getRgb()

      // Read per-theme grid opacity (Midnight: 0.12, Amber: 0.05, Navy: 0.14)
      const gridOpacity = parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--grid-opacity')
          .trim() || '0.10'
      )

      // ── Static dim grid ──────────────────────────────────────────────
      ctx.save()
      ctx.strokeStyle = `rgba(${rgb}, ${gridOpacity})`
      ctx.lineWidth   = 0.5
      ctx.beginPath()
      for (let c = 0; c <= cols; c++) {
        const x = c * CELL
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * CELL
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()
      ctx.restore()

      // ── Spawn timer ──────────────────────────────────────────────────
      spawnTimer.current += dt
      const spawnInterval = 0.45 + Math.random() * 0.55 // 0.45–1.0s
      if (spawnTimer.current >= spawnInterval) {
        spawnTimer.current = 0
        spawn()
        // Occasionally spawn a second pulse on a different axis
        if (Math.random() > 0.65) spawn()
      }

      // ── Update + draw pulses ─────────────────────────────────────────
      const trailPx = TRAIL_CELLS * CELL

      pulses.current = pulses.current.filter((p) => {
        // Advance position
        p.pos += p.speed * dt

        const totalLen = p.axis === 'h' ? W : H

        // Remove pulse once tail has passed the end of the line
        if (p.pos - trailPx > totalLen) return false

        // Compute line coordinate
        const lineCoord = p.lineIndex * CELL

        // Head is clamped to line length; tail fades from head
        const head = Math.min(p.pos, totalLen)
        const tail = Math.max(0, p.pos - trailPx)

        // Build start/end points based on axis
        let x1: number, y1: number, x2: number, y2: number
        if (p.axis === 'h') {
          x1 = tail;      y1 = lineCoord
          x2 = head;      y2 = lineCoord
        } else {
          x1 = lineCoord; y1 = tail
          x2 = lineCoord; y2 = head
        }

        // ── Gradient trail ───────────────────────────────────────────
        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        grad.addColorStop(0,   `rgba(${rgb}, 0)`)
        grad.addColorStop(0.5, `rgba(${rgb}, ${p.alpha * 0.25})`)
        grad.addColorStop(0.8, `rgba(${rgb}, ${p.alpha * 0.6})`)
        grad.addColorStop(1,   `rgba(${rgb}, ${p.alpha})`)

        ctx.save()

        // Trail line
        ctx.lineWidth   = 1.5
        ctx.strokeStyle = grad
        ctx.shadowColor = `rgba(${rgb}, 0.85)`
        ctx.shadowBlur  = 8
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Bright head dot — the "tip" of the electrical spark
        ctx.shadowBlur = 18
        ctx.fillStyle  = `rgba(${rgb}, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(x2, y2, 2, 0, Math.PI * 2)
        ctx.fill()

        // Soft outer halo on head
        ctx.shadowBlur = 28
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.arc(x2, y2, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        return true
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      pulses.current = []
    }
  }, [theme.id]) // re-init when theme changes so colour vars update

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: 0 }}
    />
  )
}
