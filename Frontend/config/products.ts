/**
 * products.ts — Homepage featured product data.
 *
 * 6 curated products — one per manufacturing capability.
 * Each represents a different industrial sector.
 *
 * image: path relative to /public. Set to undefined until AI image is ready.
 * When image is added → drop file at the given path → card auto-upgrades.
 *
 * File drop location: d:\totalengineeringworks webapp\public\images\products\
 */

export interface Product {
  id:          string
  name:        string
  category:    string              // displayed as mono label
  specs:       { label: string; value: string }[]
  application: string              // end-use / sector
  client:      string              // which client / sector it serves
  gradient:    string              // CSS gradient for placeholder card bg
  accentColor: string              // CSS color for accent elements in placeholder
  image?:      string              // /images/products/filename.jpg — optional
}

export const featuredProducts: Product[] = [
  {
    id:          'vcb-truck',
    name:        'VCB Truck Assembly',
    category:    'Electrical Assembly',
    specs: [
      { label: 'Rating',       value: '800A'   },
      { label: 'Interrupting', value: '20 kA'  },
      { label: 'Voltage',      value: 'MV Class' },
    ],
    application: 'Power Distribution Switchgear',
    client:      'Lucy Electric · Hitachi',
    gradient:    'linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)',
    accentColor: '#D4821A',
    image:       '/images/products/Vcb-truck.jpg',
  },
  {
    id:          'brass-connector',
    name:        'Precision Brass Connector',
    category:    'CNC Machining',
    specs: [
      { label: 'Tolerance', value: '±0.003 mm'   },
      { label: 'Material',  value: 'C360 Brass'  },
      { label: 'Finish',    value: 'Nickel Plate' },
    ],
    application: 'Precision Motion Control',
    client:      'Portescap',
    gradient:    'linear-gradient(135deg, #000d1a 0%, #001a33 50%, #000d1a 100%)',
    accentColor: '#007AFF',
    image:       '/images/products/brass-connector.jpg',
  },
  {
    id:          'deep-draw',
    name:        'Deep Draw Sheet Metal',
    category:    'Sheet Metal Fabrication',
    specs: [
      { label: 'Thickness', value: '0.6–3 mm'   },
      { label: 'Process',   value: 'AMADA Press' },
      { label: 'Finish',    value: 'Powder Coat' },
    ],
    application: 'Industrial Enclosures',
    client:      'Emerson · Wind World',
    gradient:    'linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)',
    accentColor: '#8A8F98',
    image:       '/images/products/deep-draw.jpg',
  },
  {
    id:          'lv-control-panel',
    name:        'LV Control Panel',
    category:    'Electrical Control',
    specs: [
      { label: 'Voltage',   value: '415V LV'    },
      { label: 'Rating',    value: 'IP54'        },
      { label: 'Standard',  value: 'IEC 61439'  },
    ],
    application: 'Industrial Automation',
    client:      'Hitachi · Emerson',
    gradient:    'linear-gradient(135deg, #00001a 0%, #000033 50%, #00001a 100%)',
    accentColor: '#1A6FE8',
    image:       '/images/products/lv-contol-panel.jpg',
  },
  {
    id:          'defense-housing',
    name:        'Defense-Grade Housing',
    category:    'Defense Manufacturing',
    specs: [
      { label: 'Grade',    value: 'MIL-STD'      },
      { label: 'Process',  value: '5-Axis CNC'   },
      { label: 'Finish',   value: 'Hard Anodize' },
    ],
    application: 'Strategic Sector — Classified',
    client:      'Defense OEM',
    gradient:    'linear-gradient(135deg, #0f0005 0%, #1a0008 50%, #0f0005 100%)',
    accentColor: '#CC2936',
    image:       '/images/products/defense-housing.jpg',
  },
  {
    id:          'wind-sensor-mount',
    name:        'Wind Turbine Sensor Mount',
    category:    'Energy Infrastructure',
    specs: [
      { label: 'Material', value: 'SS 316L'    },
      { label: 'Rating',   value: 'IP67'        },
      { label: 'Standard', value: 'IEC 61400'  },
    ],
    application: 'Wind Energy Systems',
    client:      'Wind World · Suzlon',
    gradient:    'linear-gradient(135deg, #001a0d 0%, #002a14 50%, #001a0d 100%)',
    accentColor: '#00A878',
    image:       '/images/products/wind-sensor-mount.jpg',
  },
]
