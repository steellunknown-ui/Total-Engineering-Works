'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { Maximize2 } from 'lucide-react'

/**
 * ContactFacilityVisual — High-impact facility visual placed below the map.
 * Features a lightbox function to view the full image.
 */
export function ContactFacilityVisual() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const imageSrc = "/images/facility-panorama contact (2).png"

  return (
    <SectionContainer background="void" spacing="none" className="pb-24">
      <FadeIn>
        <div 
          onClick={() => setIsLightboxOpen(true)}
          className="relative w-full aspect-[21/9] rounded-[40px] overflow-hidden border border-border-hairline shadow-2xl group cursor-zoom-in"
        >
          <Image 
            src={imageSrc} 
            alt="Tatva Dynamics Manufacturing Floor"
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          {/* Subtle gradient overlay to match aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-void/40 to-transparent" />
          
          {/* Hover Overlay Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/20">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Maximize2 className="text-white" size={24} />
            </div>
          </div>
        </div>
      </FadeIn>

      <ImageLightbox 
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={imageSrc}
        imageAlt="Tatva Dynamics Manufacturing Floor"
        title="Electromechanical Manufacturing Facility"
      />
    </SectionContainer>
  )
}
