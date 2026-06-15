'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'

/**
 * ScrollButton — Fixed global toggle for Top/Bottom navigation.
 * 
 * Behavior:
 * - At page top: Shows "Down" arrow, scrolls to bottom.
 * - After scrolling: Shows "Up" arrow, scrolls to top.
 */
export function ScrollButton() {
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // Threshold for "Top" state (100px)
      setIsAtTop(window.scrollY < 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAction = () => {
    if (isAtTop) {
      // Scroll to bottom
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="fixed bottom-28 right-8 z-[100] flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.button
          key={isAtTop ? 'down' : 'up'}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={handleAction}
          className="
            group relative
            flex items-center justify-center
            w-12 h-12 md:w-14 md:h-14
            bg-bg-elevated/80 backdrop-blur-md
            border border-border-hairline
            text-text-primary hover:text-accent-primary
            transition-all duration-300
            rounded-none
            shadow-2xl shadow-black/40
          "
          aria-label={isAtTop ? 'Scroll to bottom' : 'Scroll to top'}
        >
          {/* Engineering corners effect on hover */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />

          {isAtTop ? (
            <ArrowDown size={22} className="animate-bounce-slow" />
          ) : (
            <ArrowUp size={22} />
          )}
        </motion.button>
      </AnimatePresence>

      {/* Optional Label (Minimalist) */}
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted/50 select-none pointer-events-none"
      >
        {isAtTop ? 'Bottom' : 'Top'}
      </motion.span>
    </div>
  )
}
