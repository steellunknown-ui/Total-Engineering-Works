/**
 * clientAuthority.ts — Strategic relationship data for the Client Authority section.
 *
 * Not a logo cloud. Not testimonials.
 * A formal record of industrial OEM relationships.
 *
 * Each entry = client name + their industry context.
 * This framing transfers their authority to Total Engineering Works.
 *
 * Rules:
 * - Names must be accurate — no invented clients
 * - Sector descriptions describe WHAT THE CLIENT DOES, not what we did for them
 * - Keep NDA-safe: no project details, no component names
 */

export const clientAuthorityContent = {
  sectionLabel: 'STRATEGIC RELATIONSHIPS',

  heading: 'Tier-1 Industrial OEMs\nTrust This Facility.',

  /**
   * Governing statement above the client table.
   * Reads like a formal supplier qualification note.
   */
  statement:
    'Total Engineering Works supplies manufactured components and sub-assemblies to multinational industrial OEMs across five sectors. Client relationships are governed by formal supply agreements.',

  clients: [
    {
      id:      'hitachi',
      name:    'Hitachi',
      sector:  'Energy & Industrial Infrastructure',
      context: 'Global manufacturer of power systems, industrial equipment, and infrastructure solutions.',
    },
    {
      id:      'emerson',
      name:    'Emerson',
      sector:  'Industrial Automation & Process Control',
      context: 'Multinational technology company supplying automation systems to process industries worldwide.',
    },
    {
      id:      'lucy-electric',
      name:    'Lucy Electric',
      sector:  'Power Distribution Equipment',
      context: 'Specialist manufacturer of medium-voltage switchgear and network solutions for power utilities.',
    },
    {
      id:      'portescap',
      name:    'Portescap',
      sector:  'Precision Motion Control',
      context: 'Manufacturer of high-precision miniature motors for medical, industrial, and aerospace applications.',
    },
    {
      id:      'wind-world',
      name:    'Wind World',
      sector:  'Wind Energy Infrastructure',
      context: 'Developer and manufacturer of wind turbine systems for utility-scale energy generation.',
    },
  ],

  /**
   * Disclaimer line — essential for procurement credibility.
   * Prevents overstating the relationship. Shows legal maturity.
   */
  disclaimer:
    'Client relationships are subject to non-disclosure agreements. Project-specific references available upon formal engagement.',
} as const
