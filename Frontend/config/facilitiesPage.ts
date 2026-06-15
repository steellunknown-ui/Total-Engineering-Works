// ─── Facility Stats ──────────────────────────────────────────────────────────
export interface FacilityStat {
  value: string;
  unit?: string;
  label: string;
  sub: string;
}

export const facilityStats: FacilityStat[] = [
  { value: '35,000', unit: 'sq.ft', label: 'Facility Area',      sub: 'Integrated production floor'  },
  { value: '45+',                   label: 'Machines',            sub: 'CNC, Laser, Press & more'     },
  { value: '3',       unit: 'shift', label: 'Operations',         sub: '24-hour production capability' },
  { value: 'ISO',                   label: '9001 · 14001 · 45001', sub: 'Triple-certified QMS'         },
];

// ─── Facility Gallery ─────────────────────────────────────────────────────────
export interface FacilityGalleryItem {
  id: string;
  src: string;
  caption: string;
  /** bento layout hint: 'wide' spans 2 cols on desktop, 'tall' spans 2 rows */
  span?: 'wide' | 'tall' | 'normal';
}

export const facilityGallery: FacilityGalleryItem[] = [
  {
    id: 'floor-1',
    src: '/images/facility/facility-1.jpg',
    caption: 'Main Production Floor',
    span: 'wide',
  },
  {
    id: 'floor-2',
    src: '/images/facility/facility-2.jpg',
    caption: 'Sheet Metal Fabrication Bay',
    span: 'tall',
  },
  {
    id: 'floor-3',
    src: '/images/facility/facility-3.jpg',
    caption: 'Surface Treatment Line',
    span: 'normal',
  },
  {
    id: 'floor-4',
    src: '/images/facility/facility-4.jpg',
    caption: 'Panel Assembly & Wiring',
    span: 'normal',
  },
];

// ─── Process Flow ─────────────────────────────────────────────────────────────
export interface ProcessStep {
  id: string;
  step: number;
  title: string;
  desc: string;
  icon: string; // lucide icon name
}

export const processSteps: ProcessStep[] = [
  { id: 'raw-material',  step: 1, title: 'Raw Material',    desc: 'Certified grade steel, aluminium & SS stock inspected on receipt.',  icon: 'Package'        },
  { id: 'cutting',       step: 2, title: 'Cutting',         desc: 'Laser & turret punch precision cutting to ±0.1 mm tolerance.',        icon: 'Scissors'       },
  { id: 'forming',       step: 3, title: 'Forming',         desc: 'CNC press brake bending with AMNC-PC automated angle correction.',    icon: 'GitMerge'       },
  { id: 'machining',     step: 4, title: 'Machining',       desc: '5-axis CNC milling and turning for tight-tolerance components.',      icon: 'Settings2'      },
  { id: 'welding',       step: 5, title: 'Welding & Assy',  desc: 'TIG / MIG / spot welding + sub-assembly on dedicated jig fixtures.',  icon: 'Flame'          },
  { id: 'surface',       step: 6, title: 'Surface Finish',  desc: 'Powder coat, anodise, zinc plate or passivation to spec.',           icon: 'Droplets'       },
  { id: 'qc-dispatch',   step: 7, title: 'QC & Dispatch',   desc: 'CMM + visual inspection with full traceability. Packaged to spec.',   icon: 'PackageCheck'   },
];

// ─── Machine Types / Interfaces ───────────────────────────────────────────────
export interface FacilityMachine {
  id: string;
  title: string;
  manufacturer?: string;
  model?: string;
  description: string;
  specs: { label: string; value: string }[];
  image: string;
}

export interface FacilityCategory {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  items: FacilityMachine[];
}

// ─── Machine Categories ───────────────────────────────────────────────────────
export const facilityCategories: FacilityCategory[] = [
  {
    id: 'cnc-machining',
    eyebrow: 'Capability Group 01',
    title: 'CNC Machining Centers',
    description:
      'High-precision vertical machining and turning centers for complex engineering components — tolerances to ±0.003 mm.',
    items: [
      {
        id: 'dmg-mori-nv5000',
        title: 'Vertical Machining Center',
        manufacturer: 'DMG MORI',
        model: 'NV 5000',
        description:
          'High-speed 3-axis VMC optimised for precision molds, aerospace brackets, and complex multi-feature components.',
        specs: [
          { label: 'Travel X/Y/Z',    value: '800 / 510 / 510 mm' },
          { label: 'Spindle Speed',   value: '12,000 RPM'          },
          { label: 'Tool Capacity',   value: '30 ATC'              },
          { label: 'Accuracy',        value: '±0.003 mm'           },
        ],
        image: '/images/facility/cnc-nv-5000.jpg',
      },
      {
        id: 'cnc-turning-center',
        title: 'CNC Turning Center',
        description:
          'Precision CNC lathes for high-volume production of cylindrical shafts, bushings, and flanged components.',
        specs: [
          { label: 'Max Turn Dia',    value: '350 mm'    },
          { label: 'Max Length',      value: '550 mm'    },
          { label: 'Spindle Bore',    value: '65 mm'     },
          { label: 'Control',         value: 'Fanuc 0i-TD' },
        ],
        image: '/images/facility/cnc-turner.jpg',
      },
    ],
  },
  {
    id: 'punch-bending',
    eyebrow: 'Capability Group 02',
    title: 'Punch Press & Bending',
    description:
      'Automated sheet metal fabrication with AMADA high-tonnage equipment — from 1mm to 12mm structural grade.',
    items: [
      {
        id: 'amada-turret-punch',
        title: 'CNC Turret Punch Press',
        manufacturer: 'AMADA',
        model: 'VIPROS 2510 King',
        description:
          'High-speed punching with full brush table for scratch-free processing of enclosure blanks and panel parts.',
        specs: [
          { label: 'Tonnage',        value: '20 Tons'             },
          { label: 'Sheet Size',     value: '1270 × 2500 mm'     },
          { label: 'Stroke Rate',    value: '500 HPM'             },
          { label: 'Tool Stations',  value: '31 (3 Auto-Index)'   },
        ],
        image: '/images/facility/amada-turret.jpg',
      },
      {
        id: 'amada-press-brake',
        title: 'CNC Press Brake',
        manufacturer: 'AMADA',
        model: 'HDS-8025',
        description:
          'Multi-axis synchronized bending with backgauge for complex sheet metal geometry and tight angular tolerance.',
        specs: [
          { label: 'Bending Force',  value: '80 Tons'  },
          { label: 'Bending Length', value: '2500 mm'  },
          { label: 'Control',        value: 'AMNC-PC'  },
          { label: 'Repeatability',  value: '±0.01 mm' },
        ],
        image: '/images/facility/amada-bending.jpg',
      },
    ],
  },
  {
    id: 'welding',
    eyebrow: 'Capability Group 03',
    title: 'Welding & Assembly',
    description:
      'Dedicated welding stations with certified welders for structural and precision sub-assemblies.',
    items: [
      {
        id: 'tig-mig-stations',
        title: 'TIG & MIG Welding',
        description:
          'Heavy-duty welding bays for stainless steel, aluminium, and mild steel structural assemblies.',
        specs: [
          { label: 'Process',    value: 'GTAW / GMAW'   },
          { label: 'Capacity',   value: 'Up to 400 A'   },
          { label: 'Materials',  value: 'SS · Al · MS'  },
          { label: 'Standards',  value: 'AWS D1.1'      },
        ],
        image: '/images/facility/tig-welding.jpg',
      },
      {
        id: 'spot-welding',
        title: 'Pneumatic Spot Welding',
        description:
          'High-consistency resistance welding for sheet metal enclosures, panels, and chassis assembly.',
        specs: [
          { label: 'Power',        value: '50 KVA'    },
          { label: 'Throat Depth', value: '450 mm'    },
          { label: 'Operation',    value: 'Pneumatic' },
          { label: 'Weld Type',    value: 'Resistance' },
        ],
        image: '/images/facility/spot-welding.jpg',
      },
    ],
  },
  {
    id: 'surface-treatment',
    eyebrow: 'Capability Group 04',
    title: 'Surface Treatment',
    description:
      'In-house powder coating conveyorised line for high-durability finishing across all component types.',
    items: [
      {
        id: 'powder-coating-line',
        title: 'Conveyorised Powder Coating',
        description:
          'Automated 7-tank pre-treatment + oven cure line. Consistent RAL/custom colour matching for OEM requirements.',
        specs: [
          { label: 'Line Type',     value: 'Batch + Conveyor' },
          { label: 'Oven Length',   value: '12 Meters'        },
          { label: 'Curing Temp',   value: 'Up to 250 °C'     },
          { label: 'Pre-treatment', value: '7-Tank Phosphate'  },
        ],
        image: '/images/facility/powder-coating-shop.png',
      },
      {
        id: 'plating-anodising-line',
        title: 'Plating & Anodising',
        description:
          'Advanced zinc plating, anodising, and passivation treatments ensuring superior corrosion resistance and surface finish.',
        specs: [
          { label: 'Processes',    value: 'Zinc, Anodise, Passivation' },
          { label: 'Standards',    value: 'RoHS Compliant'        },
          { label: 'Capacity',     value: 'High-Volume Batch'     },
          { label: 'Inspection',   value: 'Salt Spray Testing'    },
        ],
        image: '/images/facility/plating-anodising.png',
      },
    ],
  },
];
