'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { navItems } from '@/config/navigation'
import { siteConfig } from '@/config/site'
import { navBackground, drawerSlide } from '@/lib/motion-variants'
import { Button } from '@/components/ui/Button'
import { ThemeSwitcher, ThemeSwitcherMobile } from '@/components/layout/ThemeSwitcher'
import { useRFQModal } from '@/context/RFQModalContext'
import { cn } from '@/utils/cn'

/**
 * Navbar — Apple-style transparent-to-frosted-glass header.
 * Enhanced with animated layout underline and scroll-spy for anchors.
 */
export function Navbar() {
  const pathname = usePathname()
  const [isScrolled,    setIsScrolled]    = useState(false)
  const [isDrawerOpen,  setIsDrawerOpen]  = useState(false)
  const { openModal } = useRFQModal()

  // Scroll detection for background change
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isDrawerOpen])

  // Only real route pages participate in the active underline.
  // Homepage anchor links still work for scrolling, but Home stays active on `/`.
  const currentActive = pathname

  // Handle clicking a nav item
  const handleNavClick = (href: string) => {
    setIsDrawerOpen(false)
  }

  return (
    <>
      <motion.header
        variants={navBackground}
        animate={isScrolled ? 'solid' : 'transparent'}
        initial="transparent"
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled 
            ? 'h-[80px] bg-bg-base/80 backdrop-blur-xl border-b border-border-hairline shadow-lg' 
            : 'h-[100px] bg-transparent border-b border-transparent'
        )}
      >
        <div className="mx-auto h-full flex max-w-[1440px] items-center justify-between px-6 md:px-10 xl:px-12">

          {/* Logo / Wordmark */}
          <Link
            href="/"
            className="flex items-center group focus-visible:outline-none"
            aria-label="Total Engineering Works — Home"
          >
            <img 
              src="/logo.png" 
              alt="Total Engineering Works Logo" 
              className="h-16 md:h-20 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-10" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = !item.href.startsWith('/#') && currentActive === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'relative py-2 font-sans text-[13px] font-medium uppercase tracking-[0.05em] transition-colors duration-200',
                    isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-primary rounded-full shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Desktop right-side actions */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            <ThemeSwitcher />
            <Button
              as="link"
              href="/request-quote"
              variant="primary"
              size="sm"
              className="px-4 lg:px-6 rounded-sharp font-semibold tracking-tight whitespace-nowrap"
            >
              Request A Quote
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex md:hidden items-center justify-center h-10 w-10 text-text-secondary hover:text-text-primary transition-colors"
          >
            {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            <motion.div
              variants={drawerSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-bg-elevated border-l border-border-hairline flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-6 h-[80px] border-b border-border-hairline">
                <span className="font-sans text-[14px] font-bold text-text-primary tracking-[-0.01em]">
                  NAVIGATION
                </span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-10 w-10 flex items-center justify-center text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col px-4 pt-4">
                {navItems.map((item) => {
                  const isActive = !item.href.startsWith('/#') && currentActive === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        'flex items-center h-[56px] px-4 rounded-sharp',
                        'font-sans text-[16px] font-medium transition-colors',
                        isActive 
                          ? 'bg-accent-primary/10 text-accent-primary' 
                          : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto p-6 border-t border-border-hairline bg-bg-base/50">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[12px] font-mono text-text-muted uppercase tracking-widest">Theme</span>
                  <ThemeSwitcherMobile />
                </div>
                <Button
                  as="link"
                  href="/request-quote"
                  onClick={() => setIsDrawerOpen(false)}
                  variant="primary"
                  className="w-full justify-center h-12 rounded-sharp font-bold"
                >
                  Get A Quote
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
