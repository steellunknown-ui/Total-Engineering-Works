'use client'

import { motion } from 'framer-motion'
import { slideUp } from '@/lib/motion-variants'
import { cn } from '@/utils/cn'

interface SlideUpProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/**
 * Slide-up variant — more pronounced than FadeIn.
 * Used for hero headlines and primary section headings.
 */
export function SlideUp({ children, delay = 0, className }: SlideUpProps) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
