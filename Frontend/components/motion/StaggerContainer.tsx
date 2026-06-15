'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeIn } from '@/lib/motion-variants'
import { cn } from '@/utils/cn'

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Stagger parent — when this enters the viewport, children animate in sequence.
 * Children must each be wrapped in a motion element using fadeIn variant.
 * Stagger delay: 80ms between children.
 */
export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '100px' }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger child — use inside StaggerContainer.
 * Inherits stagger timing from parent.
 */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={fadeIn} className={cn(className)}>
      {children}
    </motion.div>
  )
}
