'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ImageLightbox } from '@/components/ui/ImageLightbox'

interface LightboxState {
  src: string
  alt: string
  title: string
}

interface ImageLightboxContextType {
  openLightbox: (data: LightboxState) => void
  closeLightbox: () => void
}

const ImageLightboxContext = createContext<ImageLightboxContextType | undefined>(undefined)

export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  const openLightbox = useCallback((data: LightboxState) => {
    setLightbox(data)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightbox(null)
  }, [])

  return (
    <ImageLightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      <ImageLightbox
        isOpen={!!lightbox}
        onClose={closeLightbox}
        imageSrc={lightbox?.src || ''}
        imageAlt={lightbox?.alt || ''}
        title={lightbox?.title || ''}
      />
    </ImageLightboxContext.Provider>
  )
}

export function useImageLightbox() {
  const context = useContext(ImageLightboxContext)
  if (context === undefined) {
    throw new Error('useImageLightbox must be used within an ImageLightboxProvider')
  }
  return context
}
