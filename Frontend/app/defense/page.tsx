import type { Metadata } from 'next'
import { DefenseHero } from '@/components/sections/Defense/DefenseHero'
import { DefenseAuthority } from '@/components/sections/Defense/DefenseAuthority'
import { DefenseProducts } from '@/components/sections/Defense/DefenseProducts'
import { DefenseCompliance } from '@/components/sections/Defense/DefenseCompliance'
import { DefenseCTA } from '@/components/sections/Defense/DefenseCTA'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: `Defense & Specialized Projects — ${siteConfig.name}`,
  description: 'Mission-critical precision components for India\'s defense forces. MIL-STD compliant manufacturing with 100% traceability.',
}

/**
 * Defense Page — Specialized landing for tactical manufacturing.
 * 
 * 5 Sections:
 * 1. DefenseHero (Cinematic)
 * 2. DefenseAuthority (Armed Forces trust)
 * 3. DefenseProducts (Hardware portfolio)
 * 4. DefenseCompliance (Manufacturing excellence & Certs)
 * 5. DefenseCTA (Conversion)
 */
export default function DefensePage() {
  return (
    <main className="bg-bg-void">
      {/* Section 1: Hero */}
      <DefenseHero />

      {/* Section 2: Armed Forces Authority */}
      <DefenseAuthority />

      {/* Section 3: Products Portfolio */}
      <DefenseProducts />

      {/* Section 4: Manufacturing Excellence (Certs) */}
      <DefenseCompliance />

      {/* Section 5: Compact Defense CTA */}
      <DefenseCTA />
    </main>
  )
}
