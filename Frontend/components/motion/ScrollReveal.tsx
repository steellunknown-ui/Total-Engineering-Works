'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface ScrollRevealProps {
  children:  React.ReactNode
  className?: string
  delay?:    number   // seconds — use for stagger
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?:  number  // px to travel
  duration?:  number  // seconds
}

/**
 * ScrollReveal — Bidirectional scroll-triggered animation.
 *
 * Uses Framer Motion `useInView` with `once: false` so the animation
 * fires EVERY time the element enters or leaves the viewport — both
 * scrolling DOWN and scrolling UP.
 *
 * Usage:
 *   <ScrollReveal delay={index * 0.08}>
 *     <YourCard />
 *   </ScrollReveal>
 */
export function ScrollReveal({
  children,
  className,
  delay     = 0,
  direction = 'up',
  distance  = 36,
  duration  = 0.55,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  // once: false  → re-triggers every time element enters/exits viewport
  // margin       → starts animation slightly before element fully enters
  const isInView = useInView(ref, {
    once:   false,
    margin: '-5% 0px -5% 0px',
  })

  // Build the hidden → visible transform based on direction
  const hiddenOffset = {
    up:    { y:  distance, x: 0        },
    down:  { y: -distance, x: 0        },
    left:  { x:  distance, y: 0        },
    right: { x: -distance, y: 0        },
  }[direction]

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...hiddenOffset }}
      animate={{
        opacity: isInView ? 1 : 0,
        y:       isInView ? 0 : hiddenOffset.y ?? 0,
        x:       isInView ? 0 : hiddenOffset.x ?? 0,
      }}
      transition={{
        duration,
        delay:  isInView ? delay : 0,   // delay only on enter, instant on exit
        ease:   [0.22, 1, 0.36, 1],     // smooth ease-out quart
      }}
    >
      {children}
    </motion.div>
  )
}
