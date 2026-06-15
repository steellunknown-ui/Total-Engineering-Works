'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  imageAlt: string
  title: string
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title,
}: ImageLightboxProps) {
  // Prevent scrolling when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md cursor-zoom-out"
          />

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClose}
            className="absolute top-6 right-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </motion.button>

          {/* Image Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-[105] max-h-[90vh] max-w-[95vw] overflow-hidden shadow-2xl"
          >
            <div className="relative aspect-auto">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="max-h-[85vh] w-auto object-contain border border-white/10 shadow-2xl"
              />
              
              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary mb-1">
                  Reference Detail
                </p>
                <h3 className="font-sans text-xl font-semibold text-white tracking-tight">
                  {title}
                </h3>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
