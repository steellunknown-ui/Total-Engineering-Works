'use client'

import { Button } from '@/components/ui/Button'
import { useRFQModal } from '@/context/RFQModalContext'

export function RFQActions() {
  const { openModal } = useRFQModal()

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Button
        variant="primary"
        size="lg"
        onClick={() => openModal('rfq')}
      >
        Submit Your RFQ
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => openModal('enquiry')}
      >
        General Enquiry
      </Button>
    </div>
  )
}
