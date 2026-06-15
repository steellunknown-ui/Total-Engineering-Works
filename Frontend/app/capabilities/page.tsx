import { Metadata } from 'next'
import { CapabilitiesPage } from '@/components/sections/Capabilities/CapabilitiesPage'

export const metadata: Metadata = {
  title: 'Manufacturing Capabilities | Total Engineering Works',
  description:
    'Six core manufacturing disciplines — Sheet Metal Fabrication, CNC Machining, Welding, Surface Treatment, Control Panels & CAD/CAM — all performed in-house at our 50,000 sq ft facility.',
}

export default function CapabilitiesRoute() {
  return <CapabilitiesPage />
}
