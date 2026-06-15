/**
 * industries.ts — Five sectors Total Engineering Works supplies to.
 * Used in the Industries section between ClientAuthority and Capabilities.
 */

export interface IndustrySector {
  id:         string
  index:      string          // 01 – 05
  title:      string
  description:string
  icon:       string          // Lucide icon name
  keySupply:  string[]        // Specific products supplied to this sector
  clients:    string          // Representative clients in this sector
  isDefense?: boolean         // True → special crimson accent treatment
}

export const industries: IndustrySector[] = [
  {
    id:          'telecom',
    index:       '01',
    title:       'Telecom',
    description: 'Precision sheet metal enclosures, mounting structures, and cable management assemblies for network infrastructure.',
    icon:        'Wifi',
    keySupply:   ['RF Enclosures', 'Feeder Networks', 'Mounting Structures'],
    clients:     'Wind World · Emerson',
  },
  {
    id:          'energy',
    index:       '02',
    title:       'Energy',
    description: 'Control panels, structural fabrications, and machined components for power generation, distribution, and renewables.',
    icon:        'Zap',
    keySupply:   ['VCB Truck Assemblies', 'LV Control Panels', 'Switchgear Frames'],
    clients:     'Lucy Electric · Hitachi · Suzlon',
  },
  {
    id:          'automation',
    index:       '03',
    title:       'Automation',
    description: 'Structural frames, precision-machined brackets, and custom panels for industrial automation and robotics systems.',
    icon:        'Cpu',
    keySupply:   ['Motor Mounts', 'CNC Precision Parts', 'Enclosure Panels'],
    clients:     'Emerson · Schneider Electric',
  },
  {
    id:          'healthcare',
    index:       '04',
    title:       'Healthcare',
    description: 'Precision machined and fabricated sub-assemblies for medical equipment, requiring exacting tolerances and surface finishes.',
    icon:        'Activity',
    keySupply:   ['Precision SS Parts', 'Aluminium Frames', 'Medical Sub-Assemblies'],
    clients:     'Thermo Fisher Scientific',
  },
  {
    id:          'defense',
    index:       '05',
    title:       'Defense',
    description: 'Mission-critical components manufactured to MIL-STD specifications with complete material traceability and compliance documentation.',
    icon:        'Shield',
    keySupply:   ['MIL-STD Housings', 'Tactical Components', 'Armoured Vehicle Parts'],
    clients:     'Strategic OEM · Classified',
    isDefense:   true,
  },
]
