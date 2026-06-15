import type { Machine } from '@/types'

export const machines: Machine[] = [
  {
    id: 'dmg-nhx-5000',
    manufacturer: 'DMG MORI',
    model: 'NHX 5000',
    category: 'CNC Machining Center',
    specs: [
      { label: 'Axes',      value: '5-Axis' },
      { label: 'Travel X',  value: '500 mm' },
      { label: 'Travel Y',  value: '500 mm' },
      { label: 'Travel Z',  value: '450 mm' },
      { label: 'Spindle',   value: '12,000 RPM' },
      { label: 'Tolerance', value: '±0.003 mm' },
    ],
    image: '/images/machines/nhx-5000.jpg',
  },
  {
    id: 'amada-laser',
    manufacturer: 'AMADA',
    model: 'LCG 3015 AJ',
    category: 'Fiber Laser Cutting',
    specs: [
      { label: 'Laser Output', value: '3 kW' },
      { label: 'Sheet Size',   value: '3,048 × 1,524 mm' },
      { label: 'Thickness',    value: 'Up to 25 mm (mild steel)' },
      { label: 'Positioning',  value: '±0.05 mm' },
    ],
    image: '/images/machines/lcg-3015.jpg',
  },
  {
    id: 'amada-press',
    manufacturer: 'AMADA',
    model: 'HDS 8025 NT',
    category: 'CNC Press Brake',
    specs: [
      { label: 'Bending Force', value: '80 Ton' },
      { label: 'Bending Length', value: '2,500 mm' },
      { label: 'Back Gauge',    value: 'CNC 6-Axis' },
      { label: 'Accuracy',      value: '±0.01°' },
    ],
    image: '/images/machines/hds-8025.jpg',
  },
]
