'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { CategorySection } from '@/components/sections/Products/CategorySection'
import { Button } from '@/components/ui/Button'
import { GridBackground } from '@/components/ui/GridBackground'
import { useRFQModal } from '@/context/RFQModalContext'
import { productCategories } from '@/config/productsPage'
import { cn } from '@/utils/cn'

export default function ProductsPage() {
  const { openModal } = useRFQModal()
  const totalProducts = productCategories.reduce(
    (count, category) => count + category.products.length,
    0
  )

  const [activeId, setActiveId] = useState(productCategories[0].id)

  // Track which category section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )

    productCategories.forEach((cat) => {
      const el = document.getElementById(cat.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div id="products-top" className="bg-bg-base">
      <section className="relative overflow-hidden bg-bg-void border-b border-border-hairline pt-24 pb-8 md:pt-32 md:pb-10">
        
        {/* Background Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image 
            src="/images/products-hero.png" 
            alt="Reference Manufacturing Portfolio Background"
            fill
            className="object-cover opacity-60 object-center"
            priority
          />
          {/* Gradient to ensure text readability on the left, fading to transparent on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-void via-bg-void/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-transparent to-transparent" />
        </div>

        <SectionContainer spacing="none" className="relative z-10">
          <FadeIn>
            <div className="flex flex-col gap-5 max-w-3xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary">
                Reference Manufacturing Catalog
              </p>
              <h1 className="font-sans font-bold text-display-sm md:text-display-md text-text-primary tracking-[-0.03em] leading-tight">
                Product<br />Portfolio
              </h1>
              <p className="font-sans text-body-lg text-text-secondary leading-[1.65] max-w-2xl">
                A structured catalog of machined parts, fabricated assemblies, electrical panels and special-purpose builds.
              </p>
              <div className="flex flex-wrap gap-8 mt-2 pt-6 border-t border-border-hairline">
                {[
                  { value: productCategories.length, label: 'Catalog Chapters' },
                  { value: totalProducts, label: 'Reference Products' },
                  { value: '24h', label: 'RFQ Response Goal' },
                  { value: '100%', label: 'In-House Build' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="font-mono font-bold text-xl text-text-primary">{item.value}</span>
                    <span className="font-sans text-[12px] text-text-muted uppercase tracking-[0.08em]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </SectionContainer>
      </section>

      {/* ── Sticky Nav (Styled like Capabilities) ── */}
      <section className="sticky top-[64px] z-30 border-b border-border-hairline bg-bg-void/95 backdrop-blur hidden md:block">
        <SectionContainer spacing="none">
          <div className="flex items-stretch overflow-x-auto scrollbar-none">
            {productCategories.map((category, index) => {
              const isActive = activeId === category.id
              return (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className={cn(
                    'relative flex-shrink-0 flex flex-col items-center justify-center gap-0.5',
                    'px-6 py-3 border-r border-border-hairline last:border-r-0',
                    'transition-colors duration-300 group whitespace-nowrap',
                    isActive ? 'bg-accent-primary/10' : 'hover:bg-white/[0.03]'
                  )}
                >
                  {/* Index */}
                  <span className={cn(
                    'font-mono text-[9px] tracking-[0.18em] transition-colors duration-300',
                    isActive ? 'text-accent-primary' : 'text-text-muted/60 group-hover:text-text-muted'
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {/* Title */}
                  <span className={cn(
                    'font-mono text-[10px] uppercase tracking-[0.12em] font-medium transition-colors duration-300',
                    isActive ? 'text-white' : 'text-text-secondary/70 group-hover:text-text-secondary'
                  )}>
                    {category.title}
                  </span>
                  {/* References Count */}
                  <span className={cn(
                    'font-mono text-[8px] uppercase tracking-[0.1em] opacity-40 transition-colors duration-300',
                    isActive ? 'text-text-secondary' : 'text-text-muted'
                  )}>
                    {category.products.length} References
                  </span>
                  {/* Active indicator bar */}
                  <span className={cn(
                    'absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300',
                    isActive ? 'bg-accent-primary opacity-100' : 'bg-transparent opacity-0'
                  )} />
                </a>
              )
            })}
          </div>
        </SectionContainer>
      </section>

      <div className="bg-bg-base">
        {productCategories.map((category, index) => (
          <CategorySection
            key={category.id}
            category={category}
            index={index}
            totalCategories={productCategories.length}
          />
        ))}
      </div>

      <section className="border-t border-border-hairline bg-accent-primary py-16 md:py-20">
        <SectionContainer spacing="none">
          <FadeIn>
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-[62ch] flex-col gap-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/75">
                  Next Step
                </p>
                <h2 className="font-sans text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-white md:text-[48px]">
                  Have a drawing pack?
                  <br />
                  Let us price it properly.
                </h2>
                <p className="font-sans text-[16px] leading-[1.75] text-white/80">
                  Send the RFQ, target volumes, material requirements and any critical tolerance notes. The team can translate this catalog into a custom quotation against your exact build requirement.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  className="bg-bg-void text-text-primary hover:bg-bg-base"
                  onClick={() => openModal('rfq')}
                >
                  Submit RFQ
                </Button>
                <Button
                  as="link"
                  href="#products-top"
                  variant="secondary"
                  className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
                >
                  Back To Top
                </Button>
              </div>
            </div>
          </FadeIn>
        </SectionContainer>
      </section>
    </div>
  )
}
