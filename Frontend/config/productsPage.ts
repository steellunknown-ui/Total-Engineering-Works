export interface ProductItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  specs?: { label: string; value: string }[];
  material?: string;
  category: string;
}

export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  products: ProductItem[];
}

export const productCategories: ProductCategory[] = [
  {
    id: 'machined',
    title: 'Machined Components',
    description: 'High-precision CNC turning and milling with tolerances up to ±0.005mm.',
    products: [
      {
        id: 'brass-connector',
        title: 'Brass Connector',
        description: 'Durable brass connectors for industrial applications.',
        image: '/images/products/brass-connector.jpg',
        category: 'machined'
      },
      {
        id: 'rf-connectors',
        title: 'RF Connectors',
        description: 'High-frequency connectors for signal transmission.',
        image: '/images/products/rf-connectors.jpg',
        category: 'machined'
      },
      {
        id: 'nozzle',
        title: 'Nozzle',
        description: 'Precision engineered nozzles for fluid dynamics.',
        image: '/images/products/nozzle.jpg',
        category: 'machined'
      },
      {
        id: 'healthcare-shaft',
        title: 'Shaft for Healthcare',
        description: 'Surgical grade precision shafts for medical equipment.',
        image: '/images/products/healthcare-shaft.jpg',
        category: 'machined'
      },
      {
        id: 'precise-ss-shaft',
        title: 'Precise Machining Shaft in SS 304',
        description: 'Stainless Steel 304 shaft with tight tolerance finishing.',
        image: '/images/products/precise-ss-shaft.jpg',
        category: 'machined'
      },
      {
        id: 'telecom-channel',
        title: 'Channel for Telecom',
        description: 'Custom communication channels for telecom infrastructure.',
        image: '/images/products/telecom-channel.jpg',
        category: 'machined'
      },
      {
        id: 'alum-casting',
        title: 'Aluminium Casting',
        description: 'High-quality aluminium cast components.',
        image: '/images/products/aluminium-casting.jpg',
        category: 'machined'
      },
      {
        id: 'machined-spacers',
        title: 'Machined Spacers',
        description: 'Precision machined spacers for mechanical assemblies.',
        image: '/images/products/machined-spacers.jpg',
        category: 'machined'
      },
      {
        id: 'grinder-cutter',
        title: 'Grinder Cutter',
        description: 'Industrial grade cutting tools for grinding operations.',
        image: '/images/products/grinder-cutter.jpg',
        category: 'machined'
      }
    ]
  },
  {
    id: 'sheetmetal',
    title: 'Plastic Components & Sheet Metal',
    description: 'Custom enclosures, brackets, and deep-drawn assemblies.',
    products: [
      {
        id: 'deep-draw',
        title: 'Deep Draw Component',
        description: 'Seamless metal forming for specialized containers.',
        image: '/images/products/deep-draw.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'gsm-feeder',
        title: 'Feeder Net for GSM Antenna',
        description: 'Specialized feeder nets for telecommunication antenna systems.',
        image: '/images/products/gsm-feeder.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'antenna-press',
        title: 'Press Component (Antenna)',
        description: 'High-precision pressed parts for antenna assemblies.',
        image: '/images/products/antenna-press.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'gsm-cage',
        title: 'Cage for GSM Antenna',
        description: 'Protective and structural cages for GSM infrastructure.',
        image: '/images/products/gsm-cage.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'bracket-comp',
        title: 'Bracket Components',
        description: 'Durable mounting brackets for industrial and telecom use.',
        image: '/images/products/bracket-comp.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'press-tool',
        title: 'Press Tool Components',
        description: 'Precision engineered components for high-speed press tools.',
        image: '/images/products/press-tool.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'gsm-gables',
        title: 'Gables for GSM Antenna',
        description: 'Custom gable components for antenna housing.',
        image: '/images/products/gsm-gables.jpg',
        category: 'sheetmetal'
      },
      {
        id: 'sm-components',
        title: 'Sheet Metal Components',
        description: 'Precision folded and fabricated sheet metal parts.',
        image: '/images/products/sm-components.jpg',
        category: 'sheetmetal'
      }
    ]
  },
  {
    id: 'electrical',
    title: 'Electrical Control Panels',
    description: 'Fully integrated power distribution and automation panels.',
    products: [
      {
        id: '33kv-trolley',
        title: '33kV Breaker Trolley',
        description: 'Mobile circuit breaker trolley for 33kV switchgear.',
        image: '/images/products/33kv-trolley.jpg',
        category: 'electrical'
      },
      {
        id: '11kv-panel',
        title: '11kV panel',
        description: 'High voltage distribution panel rated for 11kV.',
        image: '/images/products/11kv-panel.jpg',
        category: 'electrical'
      },
      {
        id: '33kv-panel',
        title: '33kv Panel',
        description: 'Extra-high voltage control panel for 33kv infrastructure.',
        image: '/images/products/33kv-panels.jpg',
        category: 'electrical'
      },
      {
        id: 'atm-panel',
        title: 'ATM Machine Panel',
        description: 'Specialized electrical interface panels for ATM systems.',
        image: '/images/products/atm-panel.jpg',
        category: 'electrical'
      },
      {
        id: 'lv-switchboard',
        title: 'LV Switchboard',
        description: 'Low voltage main switchboards for power distribution.',
        image: '/images/products/lv-switchboardjpg.jpg',
        category: 'electrical'
      },
      {
        id: 'mv-switchboard',
        title: 'MV Switchboard',
        description: 'Medium voltage distribution boards for industrial plants.',
        image: '/images/products/mv-switchboard.jpg',
        category: 'electrical'
      },
      {
        id: 'vcb-truck-800a',
        title: 'VCB truck 800A 20KA',
        description: 'Vacuum Circuit Breaker truck with 800A capacity and 20KA fault rating.',
        image: '/images/products/vcb-truck-800a.jpg',
        category: 'electrical'
      },
      {
        id: 'moulding-jb',
        title: 'Junction Box For Moulding Machines',
        description: 'Heavy-duty junction boxes designed for moulding equipment.',
        image: '/images/products/moulding-jb.jpg',
        category: 'electrical'
      },
      {
        id: 'wired-sp-box',
        title: 'Wired Up SP Box',
        description: 'Fully wired special purpose boxes for custom integration.',
        image: '/images/products/wired-sp-box.jpg',
        category: 'electrical'
      },
      {
        id: 'vodafone-split',
        title: 'Vodafone Split Panel',
        description: 'Custom split panels designed for Vodafone infrastructure.',
        image: '/images/products/vodafone-split.jpg',
        category: 'electrical'
      },
      {
        id: 'jv-calix-11kva',
        title: 'JV Calix Panel 11KVA',
        description: 'High performance 11KVA JV Calix control panel.',
        image: '/images/products/jv-calix-11kva.jpg',
        category: 'electrical'
      },
      {
        id: '33kva-outdoor',
        title: '33KVA Outdoor Panel',
        description: 'Weatherproof outdoor distribution panel rated for 33KVA.',
        image: '/images/products/33kva-outdoor.jpg',
        category: 'electrical'
      },
      {
        id: 'airtel-outdoor',
        title: 'Airtel Outdoorpanel',
        description: 'Outdoor-rated enclosures and panels for Airtel networks.',
        image: '/images/products/airtel-outdoor.jpg',
        category: 'electrical'
      }
    ]
  },
  {
    id: 'defense',
    title: 'Defense Products',
    description: 'Critical components for strategic and defense-sector OEMs.',
    products: [
      {
        id: 'bmp2-control-panel',
        title: 'Digital Control Panel BMP-II',
        description: 'Modernized digital interface and control unit for BMP-II vehicles.',
        image: '/images/products/bmp2-control-panel.jpg',
        category: 'defense'
      },
      {
        id: 'tilt-sensor-t90',
        title: 'Tilt Sensor T-90',
        description: 'Advanced inclination and tilt detection for strategic platforms.',
        image: '/images/products/tilt-sensor-t90.jpg',
        category: 'defense'
      },
      {
        id: 'wind-sensor-t90',
        title: 'Wind Sensor T-90',
        description: 'High-precision wind measurement sensor for T-90 tanks.',
        image: '/images/products/wind-sensor-t90.jpg',
        category: 'defense'
      }
    ]
  },
  {
    id: 'led',
    title: 'LED Panels',
    description: 'High-efficiency LED illumination and display solutions.',
    products: [
      {
        id: 'indirect-1x1-led',
        title: 'Indirect 1x1 LED Panel',
        description: 'Premium indirect lighting for specialized architectural applications.',
        image: '/images/products/indirect-1x1-led.jpg',
        category: 'led'
      },
      {
        id: '43w-direct-2x2',
        title: '43 Watt Direct 2x2 LED',
        description: 'High-output 43W direct lighting for industrial and commercial spaces.',
        image: '/images/products/43w-direct-2x2.jpg',
        category: 'led'
      },
      {
        id: '27w-direct-2x2',
        title: '27 Watt Direct 2x2 LED',
        description: 'Efficient 27W direct 2x2 LED panel for standard ceiling grids.',
        image: '/images/products/27w-direct-2x2.jpg',
        category: 'led'
      },
      {
        id: '27w-direct-4x1',
        title: '27 Watt Direct 4x1 LED',
        description: 'Linear 27W direct lighting solution for specialized workspaces.',
        image: '/images/products/27w-direct-4x1.jpg',
        category: 'led'
      }
    ]
  },
  {
    id: 'spm',
    title: 'Special Purpose Products',
    description: 'Custom engineered machines and special-purpose tools.',
    products: [
      {
        id: 'hv-tester',
        title: 'HV tester',
        description: 'Specialized high-voltage testing equipment for industrial components.',
        image: '/images/products/hv-tester.jpg',
        category: 'spm'
      },
      {
        id: 'super-capacitor',
        title: 'Super Capacitor',
        description: 'Custom-engineered energy storage solutions and capacitor assemblies.',
        image: '/images/products/super-capacitor.jpg',
        category: 'spm'
      },
      {
        id: 'rotor-curing-rack',
        title: 'Rotor curing Rack',
        description: 'Precision fixtures for thermal curing of industrial rotor components.',
        image: '/images/products/rotor-curing-rack.jpg',
        category: 'spm'
      }
    ]
  },
  {
    id: 'punching',
    title: 'Fabrication & Turret Punching',
    description: 'Heavy fabrication and automated turret punching services.',
    products: [
      {
        id: 'gsm-reflector',
        title: 'Reflector for GSM Antenna',
        description: 'High-precision parabolic and flat reflectors for GSM signal optimization.',
        image: '/images/products/gsm-reflector.jpg',
        category: 'punching'
      },
      {
        id: 'bpo-tables',
        title: 'BPO tables',
        description: 'Ergonomic, modular workstations designed for high-density BPO environments.',
        image: '/images/products/bpo-tables.jpg',
        category: 'punching'
      },
      {
        id: 'plastic-parts',
        title: 'Plastic Parts',
        description: 'Custom vacuum-formed or molded plastic components for industrial assemblies.',
        image: '/images/products/plastic-parts.jpg',
        category: 'punching'
      }
    ]
  }
];
