'use client'

import { Button } from '@/components/ui/Button'
import { heroContent } from '@/config/hero'
import { useRFQModal } from '@/context/RFQModalContext'

export function HeroActions() {
  const { openModal } = useRFQModal()

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button
        variant="primary"
        size="default"
        onClick={() => openModal('rfq')}
      >
        {heroContent.cta.primary.label}
      </Button>

      <Button
        as="link"
        href={heroContent.cta.secondary.href}
        variant="secondary"
        size="default"
      >
        {heroContent.cta.secondary.label}
      </Button>
    </div>
  )
}
