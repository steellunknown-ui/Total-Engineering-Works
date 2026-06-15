import { siteConfig } from './site'

/**
 * Hero section content — single source of truth.
 *
 * DEVELOPER NOTE:
 * Set `photoReady: true` once the real machined component photo
 * is placed at: /public/images/hero/cnc-precision-component.jpg
 * Until then the engineering grid fallback renders automatically.
 *
 * Never hardcode strings inside the Hero component.
 * All copy changes happen here only.
 */
export const heroContent = {
  /**
   * Toggle to true once real CNC photo is in /public/images/hero/
   * Filename: cnc-precision-component.jpg
   */
  photoReady: true,

  eyebrow: 'ISO 9001 | ISO 14001 | ISO 45001 CERTIFIED',

  headline: 'Precision\nManufacturing.\nIntelligent Engineering.',

  // Alternatives (kept for reference — do not delete):
  // 'Built for the order where rework is not an option.'
  // 'When the Tolerance is ±0.003mm, Experience is Non-Negotiable.'

  subheadline:
    'Total Engineering Works is a Tandon Group company delivering end-to-end manufacturing solutions — from sheet metal fabrication and CNC machining to electrical assemblies — serving Telecom, Energy, Healthcare, and Defense sectors globally.',

  cta: {
    primary: {
      label: 'Get a Quote →',
      href:  '/rfq',
    },
    secondary: {
      label: 'Our Capabilities',
      href:  '#capabilities',
    },
  },

  /**
   * Micro-trust signals rendered below the CTA group.
   * Keep to ≤ 4 items. Each must be a verifiable fact, not marketing copy.
   */
  microTrust: [
    '±0.003mm CNC Tolerances',
    '5-Axis DMG MORI Machining',
    'AMADA Sheet Metal Lines',
    'Tier-1 Supplier Since 1999',
  ],

  /**
   * Authority pillars in the trust strip directly below the hero.
   * Discrete claim items — not client logos.
   */
  trustPillars: [
    { label: 'ISO Certified',          detail: 'Quality-assured processes' },
    { label: '25+ Years',              detail: 'In precision manufacturing' },
    { label: 'Defense Manufacturing',  detail: 'Strategic & aerospace sectors' },
    { label: 'Tandon Group Legacy',    detail: 'Institutional engineering lineage' },
  ],
} as const
