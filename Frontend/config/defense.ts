/**
 * defense.ts — Data for the dedicated Defense page.
 */

export interface DefenseProduct {
  id:          string
  name:        string
  description: string
  image:       string
  tags:        string[]
}

export const defenseProducts: DefenseProduct[] = [
  {
    id:          'wind-sensor-t90',
    name:        'Wind Sensor for T-90',
    description: 'Precision wind measurement sensors for T-90 Main Battle Tanks, enabling accurate targeting systems under extreme environmental conditions.',
    image:       '/images/products/wind-sensor-t90.jpg',
    tags:        ['MIL-STD', 'Wind Measurement', 'Precision Sensor'],
  },
  {
    id:          'tilt-sensor-t90',
    name:        'Tilt Sensor for T-90',
    description: 'Advanced tilt measurement sensors for T-90 tanks, providing real-time vehicle orientation data for ballistic computer integration.',
    image:       '/images/products/tilt-sensor-t90.jpg',
    tags:        ['MIL-STD', 'Tilt Measurement', 'Military Grade'],
  },
  {
    id:          'bmp2-control-panel',
    name:        'Digital Control Panel for BMP-II',
    description: 'Custom-engineered digital control panels for BMP-II Infantry Combat Vehicles, designed for high-reliability operations in armored environments.',
    image:       '/images/products/bmp2-control-panel.jpg',
    tags:        ['BMP-II', 'Digital Controls', 'Armored Vehicle'],
  },
  {
    id:          'defense-housing',
    name:        'High-Precision Defense Housing',
    description: '5-axis CNC machined housings for strategic defense electronics, featuring hard anodized finishes and complete material traceability.',
    image:       '/images/products/defense-housing.jpg',
    tags:        ['5-Axis CNC', 'Tactical Housing', 'Aerospace Grade'],
  },
]

export const defenseCompliance = [
  {
    title: 'MIL-STD Specifications',
    description: 'All defense components are manufactured and tested to meet or exceed relevant MIL-STD requirements for shock, vibration, and thermal resilience.',
  },
  {
    title: 'Traceability & Compliance',
    description: 'Full material traceability and comprehensive documentation packages provided for every batch, ensuring complete supply chain transparency.',
  },
  {
    title: 'Precision 5-Axis Machining',
    description: 'State-of-the-art 5-axis CNC capabilities allow for the production of complex geometries required for modern tactical hardware.',
  },
]
