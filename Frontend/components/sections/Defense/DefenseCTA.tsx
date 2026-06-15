'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { Button } from '@/components/ui/Button'
import { useRFQModal } from '@/context/RFQModalContext'
import { FadeIn } from '@/components/motion/FadeIn'

/**
 * DefenseCTA — Compact conversion section for the Defense page.
 * 
 * Design:
 * - Solid Orange background (#D4821A / accent-amber).
 * - Small, focused layout matching the facility CTA style.
 * - No grid background.
 */
export function DefenseCTA() {
  const { openModal } = useRFQModal()

  return (
    <section className="bg-[#D4821A] py-12 md:py-16">
      <SectionContainer spacing="none">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex flex-col gap-2 max-w-[600px]">
              <h2 className="font-sans text-[28px] md:text-[36px] font-bold leading-tight text-white tracking-tight">
                Discuss Your Defense Requirements
              </h2>
              <p className="font-sans text-[15px] md:text-[16px] text-white/90 leading-relaxed">
                Connect with our strategic projects team for technical consultation and capability mapping.
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                className="bg-black text-white hover:bg-[#1a1a1a] px-8 py-6 h-auto text-[15px] font-bold tracking-wide transition-all duration-300"
                onClick={() => openModal('rfq')}
              >
                Contact Our Defense Team
              </Button>
            </div>
          </div>
        </FadeIn>
      </SectionContainer>
    </section>
  )
}
