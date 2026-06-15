'use client'

import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { GridBackground } from '@/components/ui/GridBackground'
import { ProductDetailsCard } from './ProductDetailsCard'
import type { ProductCategory, ProductItem } from '@/config/productsPage'
import { cn } from '@/utils/cn'

interface CategorySectionProps {
  category: ProductCategory
  index: number
  totalCategories: number
}

const CATEGORY_CONTEXT: Record<
  string,
  {
    label: string
    summary: string
    pillars: string[]
  }
> = {
  machined: {
    label: 'Micron-level machining references',
    summary:
      'A curated chapter of turned, milled and precision-finished parts for motion-control, industrial and engineered mechanical systems.',
    pillars: ['Turning', 'Milling', 'Tolerance-critical'],
  },
  sheetmetal: {
    label: 'Formed and fabricated assemblies',
    summary:
      'Sheet metal references covering enclosures, brackets, busbars and formed structures built for production-ready industrial use.',
    pillars: ['Laser cut', 'Folded', 'Powder-coated'],
  },
  electrical: {
    label: 'Panel and switchboard portfolio',
    summary:
      'Integrated electrical control references spanning power distribution, motor control, instrumentation and automation-ready builds.',
    pillars: ['IEC-ready', 'Control logic', 'Box-build'],
  },
  defense: {
    label: 'Restricted, strategic manufacturing',
    summary:
      'Defence-aligned references intended to communicate ruggedisation, protected packaging and documentation-heavy production discipline.',
    pillars: ['MIL-grade intent', 'Traceability', 'Critical assemblies'],
  },
  led: {
    label: 'Lighting and display references',
    summary:
      'Compact lighting products and illuminated assemblies positioned for OEM, infrastructure and built-environment projects.',
    pillars: ['Thermal housing', 'Assembly-ready', 'Volume capable'],
  },
  spm: {
    label: 'Application-specific builds',
    summary:
      'Custom-engineered fixtures, rigs and specialized product forms intended for one-off requirements and high-value industrial deployment.',
    pillars: ['Custom engineered', 'Prototype to production', 'Application-driven'],
  },
  punching: {
    label: 'Heavy fabrication and punching',
    summary:
      'Structural fabrication references communicating throughput, repeatability and manufacturability for larger-format steel work.',
    pillars: ['Turret punching', 'Fabrication', 'Shop-floor scale'],
  },
}

function getFeaturedProduct(category: ProductCategory): ProductItem {
  return category.products.find((product) => Boolean(product.image)) ?? category.products[0]
}

export function CategorySection({
  category,
  index,
  totalCategories,
}: CategorySectionProps) {
  const featuredProduct = getFeaturedProduct(category)
  const secondaryProducts = category.products.filter(
    (product) => product.id !== featuredProduct.id
  )
  const context = CATEGORY_CONTEXT[category.id] ?? {
    label: 'Manufacturing category',
    summary: category.description,
    pillars: ['Custom engineered', 'Build-to-print', 'Production ready'],
  }
  const chapterNumber = String(index + 1).padStart(2, '0')
  const chapterTotal = String(totalCategories).padStart(2, '0')
  const isAlternate = index % 2 === 1

  return (
    <section
      id={category.id}
      className={cn(
        'relative overflow-hidden border-b border-border-hairline',
        isAlternate ? 'bg-bg-section-alt' : 'bg-bg-base'
      )}
    >
      <GridBackground />

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: isAlternate
            ? 'radial-gradient(ellipse 820px 460px at 78% 22%, rgba(var(--accent-primary-rgb),0.10) 0%, transparent 68%)'
            : 'radial-gradient(ellipse 820px 460px at 18% 18%, rgba(var(--accent-primary-rgb),0.10) 0%, transparent 68%)',
        }}
      />

      <SectionContainer spacing="default" className="relative z-10">
        <FadeIn>
          <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.88fr] lg:items-end">
            <div className="flex flex-col gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary">
                {chapterNumber} / {chapterTotal} · {context.label}
              </p>
              <h2 className="font-sans text-[34px] font-semibold leading-[0.98] tracking-[-0.03em] text-text-primary md:text-[44px] lg:text-[56px]">
                {category.title}
              </h2>
              <p className="max-w-[62ch] font-sans text-[15px] leading-[1.75] text-text-secondary md:text-[17px]">
                {category.description}
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:items-end lg:text-right">
              <p className="max-w-[54ch] font-sans text-[14px] leading-[1.72] text-text-secondary">
                {context.summary}
              </p>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {context.pillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="border border-border-hairline bg-bg-surface/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.10em] text-accent-steel"
                  >
                    {pillar}
                  </span>
                ))}
              </div>

              <div className="inline-flex flex-wrap items-center gap-3 border border-border-hairline bg-bg-surface/35 px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  Reference Products
                </span>
                <span className="font-mono text-[18px] font-semibold leading-none text-text-primary">
                  {category.products.length}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        <ScrollReveal direction="up">
          <ProductDetailsCard
            product={featuredProduct}
            categoryTitle={category.title}
            featured
            index={index}
          />
        </ScrollReveal>

        {secondaryProducts.length > 0 && (
          <div className="mt-10">
            <FadeIn>
              <div className="mb-6 flex flex-col gap-3 border-b border-border-hairline pb-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-steel">
                    Extended Catalog
                  </p>
                  <p className="font-sans text-[15px] leading-[1.65] text-text-secondary">
                    Additional reference parts from this manufacturing category.
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                  {secondaryProducts.length} additional references
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {secondaryProducts.map((product, productIndex) => (
                <ScrollReveal
                  key={product.id}
                  delay={productIndex * 0.05}
                  direction="up"
                  className="h-full"
                >
                  <ProductDetailsCard
                    product={product}
                    categoryTitle={category.title}
                    index={productIndex}
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </SectionContainer>
    </section>
  )
}
