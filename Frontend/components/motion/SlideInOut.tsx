'use client'

import { useRef, useEffect } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'

interface SlideInOutProps {
  children:  React.ReactNode
  delay?:    number    // stagger delay on enter (seconds)
  className?: string
}

/**
 * SlideInOut — Asymmetric bidirectional scroll animation.
 *
 * ENTER  (scroll down, element comes into view):
 *   → Element snaps to x = -80px (off-screen left), then slides RIGHT to x = 0
 *
 * EXIT   (scroll up, element leaves view):
 *   → Element slides RIGHT to x = +80px (off-screen right), fades out
 *
 * Works infinitely in both directions, every scroll pass.
 * Stagger is applied only on ENTER so the cascade is visible.
 */
export function SlideInOut({ children, delay = 0, className }: SlideInOutProps) {
  const ref      = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  // once: false → re-fires every time element enters OR exits viewport
  const isInView = useInView(ref, {
    once:   false,
    margin: '-5% 0px -5% 0px',
  })

  useEffect(() => {
    if (isInView) {
      // 1. Snap to left (no animation) — ensures it always enters from left
      controls.set({ x: -72, opacity: 0 })
      // 2. Slide smoothly into position
      controls.start({
        x:       0,
        opacity: 1,
        transition: {
          delay,
          duration: 0.60,
          ease:     [0.22, 1, 0.36, 1],   // ease-out quart — fast start, soft land
        },
      })
    } else {
      // Exit to the right — no delay (instant cascade feel)
      controls.start({
        x:       72,
        opacity: 0,
        transition: {
          delay:    delay * 0.3,            // much shorter stagger on exit
          duration: 0.38,
          ease:     [0.55, 0, 1, 0.45],    // ease-in — accelerates away
        },
      })
    }
  }, [isInView, controls, delay])

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ x: -72, opacity: 0 }}
      animate={controls}
    >
      {children}
    </motion.div>
  )
}
