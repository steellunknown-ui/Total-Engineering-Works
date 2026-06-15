import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { Button } from '@/components/ui/Button'
import { FileText, Download } from 'lucide-react'

/**
 * ContactPDF — Small section for downloading company resources.
 */
export function ContactPDF() {
  return (
    <section className="bg-bg-base border-y border-border-hairline py-12 md:py-16">
      <SectionContainer spacing="none">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <div className="flex flex-col gap-2">
              <h3 className="font-sans font-bold text-[20px] md:text-[24px] text-text-primary tracking-tight">
                Interested in learning more about our capabilities?
              </h3>
              <p className="font-sans text-text-secondary">
                Download our comprehensive company profile for an offline review of our machines and portfolio.
              </p>
            </div>
            <Button 
              as="link"
              href="/docs/MEPL-Company-Profile.pdf"
              external
              download
              variant="secondary"
              className="flex items-center gap-3 px-8 py-4 h-auto"
            >
              <FileText size={20} className="text-accent-primary" />
              Download Company Profile (PDF)
              <Download size={16} className="ml-2 opacity-50" />
            </Button>
          </div>
        </FadeIn>
      </SectionContainer>
    </section>
  )
}
