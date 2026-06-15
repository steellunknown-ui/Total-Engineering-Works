import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { Button } from '@/components/ui/Button'
import { MapPin, ExternalLink } from 'lucide-react'

/**
 * ContactMap — Cinematic map section for the contact page.
 */
export function ContactMap() {
  return (
    <SectionContainer background="void" spacing="default" className="border-t border-border-hairline overflow-hidden">
      <div className="flex flex-col gap-12">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col gap-4 max-w-2xl">
              <h2 className="font-sans font-bold text-[32px] md:text-[40px] text-text-primary tracking-tight">
                Strategic Locations
              </h2>
              <p className="font-sans text-body-lg text-text-secondary">
                Our facilities are strategically located in India's industrial hubs, 
                enabling efficient logistics and close proximity to key partners.
              </p>
            </div>
            <Button 
              as="link"
              href="https://maps.google.com"
              external
              variant="secondary"
              className="flex items-center gap-2 w-fit"
            >
              Open in Google Maps <ExternalLink size={14} />
            </Button>
          </div>
        </FadeIn>

        {/* Live Google Maps Embed */}
        <FadeIn delay={0.2}>
          <div className="relative w-full aspect-[21/9] rounded-[32px] overflow-hidden border border-border-hairline group bg-bg-surface shadow-2xl">
            <iframe 
              src="https://maps.google.com/maps?q=B-79,MIDC,Ambad,Nashik,Maharashtra,India&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="100%" 
              style={{ 
                border: 0,
              }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Subtle Overlay for edge smoothing */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[32px]" />
          </div>
          <p className="mt-4 font-mono text-[10px] text-text-muted uppercase tracking-wider text-center">
            Factory Location: B-79 Ambad MIDC, Nashik, Maharashtra 422010
          </p>
        </FadeIn>
      </div>
    </SectionContainer>
  )
}
