import type { Metadata }        from 'next'
import { Hero }                  from '@/components/sections/Hero'
import { LogoSlider }            from '@/components/sections/LogoSlider'
import { Products }              from '@/components/sections/Products'
import { MachineMatrix }         from '@/components/sections/MachineMatrix'
import { StatsBlock }            from '@/components/sections/StatsBlock'
import { Certifications }        from '@/components/sections/Certifications'
import { ClientAuthority }       from '@/components/sections/ClientAuthority'
import { Industries }            from '@/components/sections/Industries'
import { Capabilities }          from '@/components/sections/Capabilities'
import { ProcessTimeline }       from '@/components/sections/ProcessTimeline'
import { RFQSection }            from '@/components/sections/RFQSection'
import { siteConfig }            from '@/config/site'

export const metadata: Metadata = {
  title:       `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
}

/**
 * Homepage — Midnight Engineering. Apple-grade B2B authority.
 *
 * Section architecture (authority order):
 *  1.  Hero              ✅ Full-viewport · cinematic headline · video visual
 *  2.  LogoSlider        ✅ 3-row infinite marquee · 11 Tier-1 clients
 *  3.  Products          ✅ 6 featured products · dual-mode cards
 *  4.  MachineMatrix     ✅ DMG MORI + AMADA capital equipment specs
 *  5.  StatsBlock        ✅ 6 authority metrics · electrical grid bg
 *  6.  Certifications    ✅ ISO 9001/14001/45001 + Defense · visual cert block
 *  7.  ClientAuthority   ✅ Formal OEM table · Hitachi · Emerson · Lucy Electric
 *  8.  Industries        ✅ Sector cards
 *  9.  Capabilities      ✅ Six disciplines · electrical grid bg
 *  10. ProcessTimeline   ✅ 5-gate DFM→Delivery timeline · removes buyer risk
 *  11. RFQSection        ✅ Radial glow + electrical grid · display headline
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoSlider />
      <Products />
      <MachineMatrix />
      <StatsBlock />
      <Certifications />
      <ClientAuthority />
      <Industries />
      <Capabilities />
      <ProcessTimeline />
      <RFQSection />
    </>
  )
}
