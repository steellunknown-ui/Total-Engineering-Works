import Image from 'next/image'
import { featuredProducts }  from '@/config/products'
import type { Product }      from '@/config/products'
import { SectionContainer }  from '@/components/layout/SectionContainer'
import { FadeIn }            from '@/components/motion/FadeIn'
import { ScrollReveal }      from '@/components/motion/ScrollReveal'
import { cn }                from '@/utils/cn'
import { GridBackground } from '@/components/ui/GridBackground'

/**
 * Products — 6 featured manufactured products.
 *
 * Each card works in two modes:
 *  A. Image mode  — product photo fills top panel, specs overlay
 *  B. Spec mode   — premium gradient placeholder + large spec display
 *
 * Drop an image at the path defined in config/products.ts and the
 * card automatically upgrades to image mode — no code change needed.
 */

function ProductCard({ product }: { product: Product }) {
  const hasImage = Boolean(product.image)

  return (
    <article className="
      group flex flex-col
      border border-border-hairline
      rounded-[4px] overflow-hidden
      hover:border-border-default
      transition-colors duration-300
      bg-bg-surface
      h-full
    ">

      {/* ── Visual panel (top) ─────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '220px' }}>

        {hasImage ? (
          /* Image mode */
          <>
            <Image
              src={product.image!}
              alt={product.name}
              fill
              className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay so specs remain legible */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
            />
          </>
        ) : (
          /* Spec-card mode — premium gradient placeholder */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: product.gradient }}
          >
            {/* Large accent spec — the most important number */}
            <div className="flex flex-col items-center gap-2">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-50"
                style={{ color: product.accentColor }}
              >
                {product.specs[0].label}
              </span>
              <span
                className="font-mono font-semibold text-[42px] leading-none tracking-[-0.03em]"
                style={{ color: product.accentColor }}
              >
                {product.specs[0].value}
              </span>
            </div>

            {/* Subtle crosshair decorators */}
            <div
              className="absolute top-4 right-4 h-5 w-5 border-t border-r opacity-20"
              style={{ borderColor: product.accentColor }}
              aria-hidden
            />
            <div
              className="absolute bottom-4 left-4 h-5 w-5 border-b border-l opacity-20"
              style={{ borderColor: product.accentColor }}
              aria-hidden
            />

            {/* Horizontal grid lines — subtle engineering feel */}
            <div className="absolute inset-0 flex flex-col justify-around opacity-[0.04]" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full h-px" style={{ backgroundColor: product.accentColor }} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Content panel (bottom) ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-6 flex-1">

        {/* Product name */}
        <h3 className="font-sans font-semibold text-[17px] md:text-[19px] text-text-primary tracking-[-0.02em] leading-[1.25]">
          {product.name}
        </h3>

        {/* Spec strip — 3 key values */}
        <div className="flex gap-0 border border-border-hairline rounded-[3px] overflow-hidden">
          {product.specs.map((spec, i) => (
            <div
              key={spec.label}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 px-2',
                i > 0 && 'border-l border-border-hairline'
              )}
            >
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-text-muted leading-none">
                {spec.label}
              </span>
              <span
                className="font-mono font-semibold text-[12px] leading-none tracking-[0.02em]"
                style={{ color: i === 0 ? product.accentColor : undefined }}
              >
                {i !== 0 ? (
                  <span className="text-text-secondary">{spec.value}</span>
                ) : spec.value}
              </span>
            </div>
          ))}
        </div>

        {/* Application + client */}
        <div className="flex flex-col gap-1 mt-auto pt-1">
          <span className="font-sans text-[13px] text-text-secondary leading-none">
            {product.application}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            {product.client}
          </span>
        </div>

      </div>
    </article>
  )
}

export function Products() {
  return (
    <SectionContainer
      background="none"
      spacing="default"
      id="products"
      className="relative overflow-hidden bg-bg-base border-b border-border-hairline"
    >
      {/* Dynamic Grid Background */}
      <GridBackground />
      {/* Content above grid */}
      <div className="relative z-10">
      <FadeIn>
        {/* Section header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-[38ch]">
            <p className="font-mono text-label uppercase tracking-[0.14em] text-accent-steel">
              Featured Products
            </p>
            <h2 className="font-sans font-semibold text-section-h-sm md:text-section-h-md lg:text-section-h text-text-primary leading-[1.06] tracking-[-0.03em]">
              What we build.<br />What ships on time.
            </h2>
          </div>
          <p className="font-sans text-body text-text-secondary max-w-[42ch] leading-[1.65] md:text-right">
            Six manufacturing disciplines. Every product is produced in-house,
            inspected to drawing, and delivered to commitment.
          </p>
        </div>

        {/* 3×2 product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredProducts.map((product, index) => (
            <ScrollReveal key={product.id} delay={index * 0.07} className="h-full">
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-10 font-mono text-[11px] text-text-muted tracking-[0.06em]">
          All products manufactured at our 30,000 sq ft facility.
          Full traceability documentation available on request.
        </p>
      </FadeIn>
      </div>
    </SectionContainer>
  )
}
