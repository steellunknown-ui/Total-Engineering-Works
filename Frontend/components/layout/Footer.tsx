'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, Phone, MapPin, LinkedinIcon } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { navItems } from '@/config/navigation'

/**
 * Footer — Midnight Engineering treatment.
 *
 * Design:
 *  - bg-void (#000000) — pure black, continues the page
 *  - Top border: 1px hairline (rgba white 8%)
 *  - Brand column spans 2 of 4 columns
 *  - Trust tags: ghost-bordered mono chips
 *  - Legal strip: font-mono text-muted — minimal, precise
 */
export function Footer() {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname()

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="bg-bg-void border-t border-border-hairline">
      <div className="mx-auto max-w-container px-6 md:px-10 xl:px-container-x">

        {/* ─── Main Footer Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pt-20 pb-16">

          {/* Column 1 — Brand (spans 2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-7">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Total Engineering Works Logo" 
                className="h-16 md:h-24 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.85)]"
              />
            </div>

            <p className="font-sans text-body text-text-secondary leading-[1.70] max-w-[340px]">
              Precision manufacturing for global Tier-1 industrial clients since {siteConfig.founding}.
              ISO certified. Defense approved.
            </p>

            {/* Trust chips — ghost bordered */}
            <div className="flex flex-wrap gap-2.5">
              {['ISO Certified', 'Defense Approved', '25+ Years'].map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] text-accent-steel border border-border-hairline rounded-sharp px-3 py-1.5 tracking-[0.08em] uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Social */}
            <div className="flex items-center gap-4">
              <Link
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Total Engineering Works on LinkedIn"
                className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors duration-150 text-[13px] font-sans"
              >
                <LinkedinIcon size={14} />
                <span>LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Navigation
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Footer navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-sans text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-150 w-fit"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="#rfq"
                className="font-sans text-[14px] text-accent-primary hover:text-accent-primary-hover transition-colors duration-150 w-fit mt-3"
              >
                Request a Quotation →
              </Link>
            </nav>
          </div>

          {/* Column 2b — Quote Tool (internal) */}
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Quote Tool
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Quote Tool navigation">
              <Link
                href="/quote-tool/new"
                className="font-sans text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-150 w-fit"
              >
                New Quote
              </Link>
              <Link
                href="/quote-tool/fab-sheet"
                className="font-sans text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-150 w-fit"
              >
                FAB Sheet
              </Link>
              <Link
                href="/quote-tool/history"
                className="font-sans text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-150 w-fit"
              >
                Quote History
              </Link>
            </nav>
          </div>


          {/* Column 3 — Contact */}
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Contact
            </p>
            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-start gap-3 group"
              >
                <Mail size={14} className="text-accent-steel mt-0.5 flex-shrink-0" />
                <span className="font-sans text-[13px] text-text-secondary group-hover:text-text-primary transition-colors duration-150 break-all">
                  {siteConfig.contact.email}
                </span>
              </a>

              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="flex items-start gap-3 group"
              >
                <Phone size={14} className="text-accent-steel mt-0.5 flex-shrink-0" />
                <span className="font-sans text-[13px] text-text-secondary group-hover:text-text-primary transition-colors duration-150">
                  {siteConfig.contact.phone}
                </span>
              </a>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-accent-steel mt-0.5 flex-shrink-0" />
                  <address className="font-sans text-[13px] text-text-secondary not-italic leading-relaxed">
                    <span className="text-text-muted text-[11px] uppercase tracking-wider block mb-1">Manufacturing</span>
                    {siteConfig.address.facility}
                  </address>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-accent-steel mt-0.5 flex-shrink-0" />
                  <address className="font-sans text-[13px] text-text-secondary not-italic leading-relaxed">
                    <span className="text-text-muted text-[11px] uppercase tracking-wider block mb-1">Corporate</span>
                    {siteConfig.address.corporate}
                  </address>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hairline divider */}
        <div className="w-full h-px bg-border-hairline" />

        {/* ─── Legal Strip ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-7">
          <p className="font-mono text-[11px] text-text-muted tracking-[0.04em]">
            © {currentYear} Total Engineering Works. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <span className="font-mono text-[10px] text-text-muted tracking-[0.10em] uppercase">
              ISO Certified
            </span>
            <span className="font-mono text-[10px] text-text-muted tracking-[0.10em] uppercase">
              Defense Approved
            </span>
            <span className="font-mono text-[10px] text-text-muted tracking-[0.10em] uppercase">
              Est. 1999
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
