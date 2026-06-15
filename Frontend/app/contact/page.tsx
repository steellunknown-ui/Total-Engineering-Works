import type { Metadata } from 'next'
import { ContactHero } from '@/components/sections/Contact/ContactHero'
import { ContactFormSection } from '@/components/sections/Contact/ContactFormSection'
import { ContactMap } from '@/components/sections/Contact/ContactMap'
import { ContactFacilityVisual } from '@/components/sections/Contact/ContactFacilityVisual'
import { ContactPDF } from '@/components/sections/Contact/ContactPDF'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: `Contact Us — ${siteConfig.name}`,
  description: 'Discuss your precision manufacturing and engineering requirements with our strategic projects team.',
}

/**
 * Contact Page — The final page of the Total Engineering Works web experience.
 */
export default function ContactPage() {
  return (
    <main className="bg-bg-void">
      {/* Section 1: Hero */}
      <ContactHero />

      {/* Section 2: Contact Info & Form */}
      <ContactFormSection />

      {/* Section 3: Strategic Locations Map */}
      <ContactMap />

      {/* Section 4: Facility Panoramic Visual */}
      <ContactFacilityVisual />

      {/* Section 5: Resource Download */}
      <ContactPDF />
    </main>
  )
}
