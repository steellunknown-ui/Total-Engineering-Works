// Full capabilities page data — each capability has sub-processes with images and tags
export interface SubProcess {
  id: string
  title: string
  description: string
  image?: string
  tags: string[]
}

export interface CapabilitySection {
  id: string
  index: string   // e.g. "01"
  title: string
  description: string
  heroImage: string
  subProcesses: SubProcess[]
}

export const capabilitySections: CapabilitySection[] = [
  {
    id: 'sheet-metal',
    index: '01',
    title: 'Sheet Metal Fabrication',
    description:
      'End-to-end precision sheet metal fabrication using AMADA machinery — from raw material to finished component, entirely in-house. Tolerances held to ±0.1mm on complex assemblies.',
    heroImage: '/images/capabilities/sheet-metal.jpg',
    subProcesses: [
      {
        id: 'laser-cutting',
        title: 'Laser Cutting',
        description: 'AMADA fiber laser cutting with ±0.05mm positional accuracy on mild steel, stainless, and aluminium up to 25mm.',
        image: '/images/machines/lcg-3015.jpg',
        tags: ['AMADA LCG-3015', 'Fiber Laser', '±0.05mm', 'Up to 25mm'],
      },
      {
        id: 'cnc-bending',
        title: 'CNC Press Brake Bending',
        description: 'Multi-axis CNC press brakes for complex multi-bend profiles. Automatic tooling changes for high-mix production.',
        image: '/images/machines/hds-8025.jpg',
        tags: ['AMADA HDS-8025', 'Multi-Axis', 'Auto Tooling', 'Complex Profiles'],
      },
      {
        id: 'metal-finishing',
        title: 'Forming & Stamping',
        description: 'Progressive die stamping and deep drawing for high-volume sheet metal components with consistent dimensional accuracy.',
        image: '/images/products/deep-draw.jpg',
        tags: ['Progressive Die', 'Deep Draw', 'High Volume', 'Stamping'],
      },
    ],
  },
  {
    id: 'cnc-machining',
    index: '02',
    title: 'CNC Machining',
    description:
      'High-precision 3-axis and 5-axis CNC machining with DMG MORI machining centers. Complex geometries, tight tolerances, and high-volume runs — all performed in-house.',
    heroImage: '/images/capabilities/cnc-machining.jpg',
    subProcesses: [
      {
        id: '5-axis',
        title: '5-Axis CNC Milling',
        description: 'Full 5-axis simultaneous machining for complex aerospace and defense components. Tolerances to ±0.003mm.',
        image: '/images/machines/nhx-5000.jpg',
        tags: ['DMG MORI NHX-5000', '5-Axis', '±0.003mm', 'Aerospace Grade'],
      },
      {
        id: 'turning',
        title: 'CNC Turning & Milling',
        description: 'Multi-spindle turning centers for precision rotational components. Diameter range 5mm to 500mm.',
        image: '/images/products/defense-housing.jpg',
        tags: ['Multi-Spindle', 'CNC Lathe', 'Ø5–500mm', 'High Volume'],
      },
      {
        id: 'brass-precision',
        title: 'Precision Components',
        description: 'High-tolerance machined components in aluminium, steel, brass, and titanium for telecom, energy, and defence sectors.',
        image: '/images/products/brass-connector.jpg',
        tags: ['Brass', 'Aluminium', 'Steel', 'Titanium'],
      },
    ],
  },
  {
    id: 'welding',
    index: '03',
    title: 'Welding Solutions',
    description:
      'Industrial welding expertise across MIG, TIG, and spot welding — for structural assemblies, precision frameworks, and high-integrity pressure vessel components.',
    heroImage: '/images/capabilities/welding.jpg',
    subProcesses: [
      {
        id: 'tig-welding',
        title: 'TIG Welding',
        description: 'Precision TIG welding for stainless steel, aluminium, and exotic alloy components requiring clean, defect-free joins.',
        image: '/images/about-1.jpg',
        tags: ['Stainless Steel', 'Aluminium', 'Exotic Alloys', 'High Purity'],
      },
      {
        id: 'mig-welding',
        title: 'MIG Welding',
        description: 'High-speed MIG welding for structural steel assemblies, enclosures, and high-volume fabrication runs.',
        image: '/images/about-2.jpg',
        tags: ['Structural Steel', 'High Volume', 'Enclosures', 'Frames'],
      },
      {
        id: 'spot-welding',
        title: 'Spot & Resistance Welding',
        description: 'Resistance spot welding for sheet metal assemblies and automotive-grade components requiring consistent weld nuggets.',
        image: '/images/about-3.jpg',
        tags: ['Resistance Welding', 'Sheet Metal', 'Automotive Grade', 'Consistent Nugget'],
      },
    ],
  },
  {
    id: 'surface-treatment',
    index: '04',
    title: 'Surface Treatment',
    description:
      'In-house surface treatment capabilities for corrosion resistance, aesthetics, and functional performance — covering anodizing, powder coating, plating, and passivation.',
    heroImage: '/images/capabilities/surface-treatment.jpg',
    subProcesses: [
      {
        id: 'powder-coating',
        title: 'Powder Coating',
        description: 'Electrostatic powder coating in a full range of RAL colours. Salt spray resistance tested to 500+ hours.',
        image: '/images/facility/facility-1.jpg',
        tags: ['RAL Colours', 'Electrostatic', '500h Salt Spray', 'Texture Finish'],
      },
      {
        id: 'anodizing',
        title: 'Anodizing',
        description: 'Type II and Type III hard anodizing for aluminium components. Colour anodizing available for OEM identification.',
        image: '/images/facility/facility-2.jpg',
        tags: ['Type II', 'Type III Hard', 'Colour Anodize', 'Aluminium'],
      },
      {
        id: 'plating',
        title: 'Zinc & Nickel Plating',
        description: 'Electroplating services for corrosion protection and conductivity. RoHS-compliant processes available.',
        image: '/images/capabilities/surface-treatment.jpg',
        tags: ['Zinc Plating', 'Nickel Plating', 'RoHS Compliant', 'Corrosion Resistant'],
      },
    ],
  },
  {
    id: 'control-panels',
    index: '05',
    title: 'Control Panels & Assemblies',
    description:
      'Design and build of LV/MV electrical control panels, automation enclosures, and wiring harnesses for industrial, telecom, and energy infrastructure.',
    heroImage: '/images/capabilities/control-panels.jpg',
    subProcesses: [
      {
        id: 'lv-panels',
        title: 'LV Control Panels',
        description: 'Type-tested LV distribution boards and motor control centers (MCC) to IEC 61439 standard.',
        image: '/images/products/lv-contol-panel.jpg',
        tags: ['LV Distribution', 'MCC', 'IEC 61439', 'Type Tested'],
      },
      {
        id: 'wire-harness',
        title: 'Wire Harness & Looming',
        description: 'Custom wiring harness design and assembly for telecom infrastructure, automotive, and industrial machinery.',
        image: '/images/facility/facility-3.jpg',
        tags: ['Custom Harness', 'Telecom', 'Automotive', 'Industrial'],
      },
      {
        id: 'assembly',
        title: 'Assembly & Integration',
        description: 'Full box-build assembly integrating fabricated enclosures, PCBs, wiring, and final testing before dispatch.',
        image: '/images/facility/facility-4.jpg',
        tags: ['Box Build', 'PCB Integration', 'Final Test', 'FAT'],
      },
    ],
  },
  {
    id: 'cad-cam',
    index: '06',
    title: 'Mechanical Design & Development',
    description:
      'In-house DFM analysis, 3D modelling, and CAM programming — from customer drawings to production-ready geometry, all performed by our engineering team.',
    heroImage: '/images/capabilities/cad-cam.jpg',
    subProcesses: [
      {
        id: 'dfm',
        title: 'Design for Manufacture (DFM)',
        description: 'We analyse customer drawings for manufacturability before committing — reducing iteration cycles and tooling costs.',
        image: '/images/capabilities/cad-cam.jpg',
        tags: ['DFM Review', 'Cost Reduction', 'Tooling Optimisation', 'First-Article'],
      },
      {
        id: '3d-modelling',
        title: '3D Modelling & Simulation',
        description: 'SolidWorks-based 3D modelling, assembly simulation, and FEA analysis for design validation before production.',
        image: '/images/capabilities/3d-modelling-ar.jpg',
        tags: ['SolidWorks', 'FEA Analysis', 'Assembly Sim', 'Validation'],
      },
      {
        id: 'cam-programming',
        title: 'CAM Programming',
        description: 'In-house CAM programming for all CNC machine tools — no third-party reliance, faster iterations, full IP protection.',
        image: '/images/about-hero-bg.png',
        tags: ['Mastercam', '5-Axis CAM', 'Toolpath Optimisation', 'IP Protected'],
      },
    ],
  },
]
