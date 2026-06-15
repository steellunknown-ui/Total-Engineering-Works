import type { Capability } from '@/types'

export const capabilities: Capability[] = [
  {
    id: 'sheet-metal',
    title: 'Sheet Metal Fabrication',
    description:
      'Precision cutting, bending, and forming of sheet metal components using AMADA machinery to exact drawing specifications.',
    icon: 'Layers',
    tags: ['Laser Cutting', 'CNC Bending', 'Forming', 'AMADA'],
    image: '/images/capabilities/sheet-metal.jpg',
  },
  {
    id: 'cnc-machining',
    title: 'CNC Machining',
    description:
      '5-axis CNC machining with DMG MORI machining centers. Tolerances to ±0.003mm for complex, multi-feature components.',
    icon: 'Settings2',
    tags: ['5-Axis', 'DMG MORI', '±0.003mm', 'High Volume'],
    image: '/images/capabilities/cnc-machining.jpg',
  },
  {
    id: 'welding',
    title: 'Welding Solutions',
    description:
      'MIG, TIG, and spot welding for structural and precision assemblies across aluminium, steel, and stainless steel.',
    icon: 'Flame',
    tags: ['TIG', 'MIG', 'Stainless', 'Structural'],
    image: '/images/capabilities/welding.jpg',
  },
  {
    id: 'surface-treatment',
    title: 'Surface Treatment',
    description:
      'Anodizing, powder coating, zinc plating, and passivation for corrosion resistance and aesthetic finish.',
    icon: 'Droplets',
    tags: ['Anodizing', 'Powder Coat', 'Zinc Plating', 'Passivation'],
    image: '/images/capabilities/surface-treatment.jpg',
  },
  {
    id: 'control-panels',
    title: 'Electrical Control Panels',
    description:
      'Design and build of LV/MV control panels, automation panels, and distribution boards for industrial applications.',
    icon: 'Cpu',
    tags: ['LV/MV Panels', 'Automation', 'Distribution', 'Custom Build'],
    image: '/images/capabilities/control-panels.jpg',
  },
  {
    id: 'cad-cam',
    title: 'CAD/CAM Design & Simulation',
    description:
      'In-house DFM analysis, 3D modelling, and CAM programming — from engineering drawings to production-ready geometry.',
    icon: 'Layers3',
    tags: ['DFM Analysis', '3D Modelling', 'CAM Programming', 'SolidWorks'],
    image: '/images/capabilities/cad-cam.jpg',
  },
]
