'use client'

import { motion } from 'framer-motion'
import { staggerContainer, heroEntrance } from '@/lib/motion-variants'
import { cn } from '@/utils/cn'

/**
 * HeroMotion — client boundary for hero entrance animation.
 * Isolates all framer-motion logic from the server Hero component.
 *
 * Uses staggerContainer + heroEntrance to sequence:
 *   label → headline → subheadline → CTAs → micro-trust
 *
 * Runs immediately on mount (initial visible after 150ms delay).
 * viewport prop intentionally omitted — this always fires, hero is always above fold.
 */
export function HeroMotion({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * HeroMotionItem — individual animated child inside HeroMotion.
 * Inherits stagger timing from parent.
 */
export function HeroMotionItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={heroEntrance} className={cn(className)}>
      {children}
    </motion.div>
  )
}

/**
 * HeroVisualMotion — right-side visual panel entrance.
 * Slightly offset from content stagger: fades in from right edge.
 */
export function HeroVisualMotion({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.7,
        delay: 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
