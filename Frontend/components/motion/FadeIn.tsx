'use client'

import { motion } from 'framer-motion'
import { EASING, DURATION } from '@/lib/motion-variants'
import { cn } from '@/utils/cn'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
}

/**
 * Scroll-triggered fade-in wrapper.
 * Animates once on viewport entry — never re-animates on scroll back.
 * 
 * Now supports direction-based entrance for richer section reveals.
 */
export function FadeIn({ 
  children, 
  delay = 0, 
  direction = 'up',
  className 
}: FadeInProps) {
  
  // Calculate initial position based on direction
  const directions = {
    up:    { x: 0, y: 16 },
    down:  { x: 0, y: -16 },
    left:  { x: 16, y: 0 },
    right: { x: -16, y: 0 },
    none:  { x: 0, y: 0 }
  }

  const initialPos = directions[direction]

  return (
    <motion.div
      initial={{ opacity: 0, ...initialPos }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '100px' }}
      transition={{ 
        delay, 
        duration: DURATION.slow,
        ease: EASING.industrial 
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
