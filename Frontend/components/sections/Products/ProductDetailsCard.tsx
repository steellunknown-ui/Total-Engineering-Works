'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useRFQModal } from '@/context/RFQModalContext'
import { useImageLightbox } from '@/context/ImageLightboxContext'
import { cn } from '@/utils/cn'
import type { ProductItem } from '@/config/productsPage'

interface ProductCardProps {
  product: ProductItem
  categoryTitle: string
  featured?: boolean
  index?: number
}

function getCategoryCode(categoryTitle: string): string {
  return categoryTitle
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function getProductTags(product: ProductItem, categoryTitle: string): string[] {
  const tags = new Set<string>()

  if (product.material) tags.add(product.material)

  product.specs?.slice(0, 2).forEach((spec) => {
    tags.add(`${spec.label}: ${spec.value}`)
  })

  tags.add('Build-to-print')
  tags.add(categoryTitle)

  return Array.from(tags).slice(0, 3)
}

function ProductVisual({
  product,
  categoryCode,
  featured = false,
  index = 0,
}: {
  product: ProductItem
  categoryCode: string
  featured?: boolean
  index?: number
}) {
  const { openLightbox } = useImageLightbox()

  if (product.image) {
    return (
      <div 
        className="relative h-full w-full cursor-zoom-in group/visual"
        onClick={() => openLightbox({ 
          src: product.image!, 
          alt: product.title, 
          title: product.title 
        })}
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          className={cn(
            'object-cover object-center transition-transform duration-700',
            featured ? 'group-hover/visual:scale-[1.03]' : 'group-hover/visual:scale-[1.05]'
          )}
          sizes={
            featured
              ? '(max-width: 1024px) 100vw, 58vw'
              : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          }
        />
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            featured ? "opacity-40 group-hover/visual:opacity-10" : "opacity-30 group-hover/visual:opacity-0"
          )}
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        featured ? 'bg-[linear-gradient(135deg,#071120_0%,#0d1f3e_45%,#091325_100%)]' : 'bg-[linear-gradient(135deg,#091120_0%,#0d1830_50%,#0a1222_100%)]'
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(var(--accent-primary-rgb),0.10) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(var(--accent-primary-rgb),0.10) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: featured ? '72px 72px' : '56px 56px',
          backgroundPosition: `${index * 9}px ${index * 7}px`,
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 78% 22%, rgba(var(--accent-primary-rgb),0.22) 0%, transparent 34%)',
        }}
      />

      <div className="absolute top-5 right-5 h-7 w-7 border-t border-r border-white/15" />
      <div className="absolute bottom-5 left-5 h-7 w-7 border-b border-l border-white/15" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-primary/70">
          {categoryCode}
        </p>
        <p
          className={cn(
            'mt-2 font-sans font-semibold text-white/90 tracking-[-0.02em]',
            featured ? 'text-[26px] leading-[1.15]' : 'text-[18px] leading-[1.2]'
          )}
        >
          {product.title}
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.10em] text-white/45">
          Image direction pending art production
        </p>
      </div>
    </div>
  )
}

export function ProductDetailsCard({
  product,
  categoryTitle,
  featured = false,
  index = 0,
}: ProductCardProps) {
  const { openModal } = useRFQModal()
  const categoryCode = getCategoryCode(categoryTitle)
  const productTags = getProductTags(product, categoryTitle)

  if (featured) {
    return (
      <article className="group grid overflow-hidden border border-border-default bg-bg-surface/45 backdrop-blur-sm lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[320px] border-b border-border-hairline bg-bg-void lg:min-h-[520px] lg:border-b-0 lg:border-r">
          <ProductVisual
            product={product}
            categoryCode={categoryCode}
            featured
            index={index}
          />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="border border-accent-primary/40 bg-black/72 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-primary shadow-[0_10px_28px_rgba(0,0,0,0.38)] backdrop-blur-md">
              Featured Reference
            </span>
            <span className="border border-white/15 bg-black/68 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md">
              {categoryCode}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-8 lg:p-10">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-steel">
              Selected For Visual Focus
            </p>
            <h3 className="font-sans text-[32px] font-semibold leading-[1.02] tracking-[-0.03em] text-text-primary md:text-[42px]">
              {product.title}
            </h3>
            <p className="max-w-[56ch] font-sans text-[15px] leading-[1.75] text-text-secondary md:text-[17px]">
              {product.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-border-hairline bg-bg-base/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Material
              </p>
              <p className="mt-2 font-sans text-[14px] font-medium leading-[1.45] text-text-primary">
                {product.material ?? 'As per customer drawing'}
              </p>
            </div>
            <div className="border border-border-hairline bg-bg-base/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Manufacturing
              </p>
              <p className="mt-2 font-sans text-[14px] font-medium leading-[1.45] text-text-primary">
                Build-to-print production
              </p>
            </div>
            <div className="border border-border-hairline bg-bg-base/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Category
              </p>
              <p className="mt-2 font-sans text-[14px] font-medium leading-[1.45] text-text-primary">
                {categoryTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {productTags.map((tag) => (
              <span
                key={tag}
                className="border border-border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.10em] text-accent-steel"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-4 border-t border-border-hairline pt-6">
            <p className="font-sans text-[14px] leading-[1.65] text-text-secondary">
              Need a similar component, enclosure, panel or sub-assembly? Share the drawing pack and manufacturing constraints. The team can quote custom variants against your exact requirement.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => openModal('rfq')}
              >
                Request RFQ
              </Button>
              <Button
                variant="secondary"
                onClick={() => openModal('enquiry')}
              >
                Start Enquiry
              </Button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-border-hairline bg-bg-surface/60 backdrop-blur-sm transition-colors duration-300 hover:border-border-default">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border-hairline bg-bg-void">
        <ProductVisual
          product={product}
          categoryCode={categoryCode}
          index={index}
        />

        <div className="absolute left-4 top-4">
          <span className="border border-white/15 bg-black/68 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
            Reference Part
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-sans text-[19px] font-semibold leading-[1.18] tracking-[-0.02em] text-text-primary transition-colors group-hover:text-accent-primary">
            {product.title}
          </h3>
          <p className="font-sans text-[13px] leading-[1.7] text-text-secondary">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {productTags.map((tag) => (
              <span
                key={tag}
                className="border border-border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border-hairline pt-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                Customisation
              </span>
              <span className="font-sans text-[13px] text-text-secondary">
                Drawing-based manufacturing
              </span>
            </div>

            <button
              type="button"
              onClick={() => openModal('rfq')}
              className="inline-flex items-center justify-center text-[13px] font-semibold text-accent-primary transition-colors hover:text-text-primary"
              aria-label={`Request RFQ for ${product.title}`}
            >
              Request RFQ
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
