import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { defenseProducts } from '@/config/defense'

/**
 * DefenseProducts — Tactical product portfolio showcase.
 * Displays 4 defense-specific items with technical specs and high-quality imagery.
 */
export function DefenseProducts() {
  return (
    <SectionContainer background="void" spacing="default" id="defense-products">
      <div className="mb-16">
        <SectionHeading
          label="Tactical Portfolio"
          heading="Mission-Critical Hardware"
          subtitle="Specialized manufacturing for India's defense sector, ranging from precision sensors to armored vehicle control systems."
          align="left"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {defenseProducts.map((product, idx) => (
          <ScrollReveal key={product.id} delay={idx * 0.1}>
            <div className="group relative flex flex-col gap-6">
              {/* Image Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-bg-surface border border-border-hairline group-hover:border-[#CC293640] transition-colors duration-500">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                {/* Product Tags */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[9px] uppercase tracking-widest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3">
                <h3 className="font-sans font-semibold text-[24px] md:text-[28px] text-text-primary tracking-tight group-hover:text-[#CC2936] transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="font-sans text-body text-text-secondary leading-relaxed">
                  {product.description}
                </p>
                <div className="w-12 h-px bg-[#CC2936] mt-2 group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionContainer>
  )
}
