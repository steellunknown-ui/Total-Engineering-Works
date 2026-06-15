'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Check } from 'lucide-react'
import { useTheme, THEMES, type ThemeId } from '@/context/ThemeContext'
import { cn } from '@/utils/cn'

/**
 * ThemeSwitcher — Compact, premium palette switcher for the Navbar.
 *
 * Desktop: Icon button → floating panel with 3 theme cards.
 * Mobile: Inline component inside the drawer.
 *
 * Each theme card shows:
 *   - Name + description
 *   - Colour swatches (bg + surface + accent)
 *   - Active checkmark
 */

// ─── Desktop Switcher (icon + floating panel) ───────────────────────────────

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleSelect = (id: ThemeId) => {
    setTheme(id)
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      {/* Trigger button */}
      <button
        type="button"
        id="theme-switcher-trigger"
        aria-label="Change colour theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-cta',
          'font-mono text-[11px] tracking-[0.10em] uppercase',
          'border transition-all duration-200',
          isOpen
            ? 'border-border-active text-text-primary bg-bg-surface'
            : 'border-border-hairline text-accent-steel hover:border-border-default hover:text-text-secondary bg-transparent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
        )}
      >
        {/* Live accent dot */}
        <span
          className="h-2 w-2 rounded-full flex-shrink-0 transition-all duration-300"
          style={{ backgroundColor: theme.accent }}
          aria-hidden
        />
        <Palette size={12} strokeWidth={2} />
        <span className="hidden lg:inline">{theme.name}</span>
      </button>

      {/* Floating panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="theme-switcher-panel"
            role="menu"
            aria-label="Select colour theme"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute right-0 top-[calc(100%+8px)]',
              'w-[280px] z-[60]',
              'rounded-[10px] overflow-hidden',
              'bg-bg-elevated border border-border-default',
              'shadow-[0_24px_60px_rgba(0,0,0,0.5)]',
            )}
          >
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-border-hairline">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-text-muted">
                Colour Theme
              </p>
            </div>

            {/* Theme options */}
            <div className="p-2 flex flex-col gap-1">
              {themes.map((t) => (
                <ThemeCard
                  key={t.id}
                  themeMeta={t}
                  isActive={t.id === theme.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {/* Footer label */}
            <div className="px-4 py-2.5 border-t border-border-hairline">
              <p className="font-mono text-[10px] tracking-[0.10em] text-text-muted">
                Preference saved automatically
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Mobile inline switcher (inside drawer) ─────────────────────────────────

export function ThemeSwitcherMobile() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="flex flex-col gap-1" aria-label="Select colour theme">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-text-muted px-1 mb-1">
        Colour Theme
      </p>
      {themes.map((t) => (
        <ThemeCard
          key={t.id}
          themeMeta={t}
          isActive={t.id === theme.id}
          onSelect={setTheme}
        />
      ))}
    </div>
  )
}

// ─── Shared ThemeCard ────────────────────────────────────────────────────────

interface ThemeCardProps {
  themeMeta: typeof THEMES[number]
  isActive:  boolean
  onSelect:  (id: ThemeId) => void
}

function ThemeCard({ themeMeta, isActive, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(themeMeta.id)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px]',
        'text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
        isActive
          ? 'bg-bg-surface border border-border-active'
          : 'bg-transparent border border-transparent hover:bg-bg-surface/50 hover:border-border-hairline'
      )}
    >
      {/* Colour swatches */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span
          className="h-5 w-5 rounded-[4px] border border-white/10 flex-shrink-0"
          style={{ backgroundColor: themeMeta.bg }}
          aria-hidden
        />
        <span
          className="h-5 w-5 rounded-[4px] border border-white/10 flex-shrink-0"
          style={{ backgroundColor: themeMeta.surface }}
          aria-hidden
        />
        <span
          className="h-5 w-5 rounded-[4px] border border-white/10 flex-shrink-0"
          style={{ backgroundColor: themeMeta.accent }}
          aria-hidden
        />
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span
          className={cn(
            'font-sans text-[13px] font-medium leading-none',
            isActive ? 'text-text-primary' : 'text-text-secondary'
          )}
        >
          {themeMeta.name}
        </span>
        <span className="font-mono text-[10px] text-text-muted leading-none tracking-[0.04em]">
          {themeMeta.description}
        </span>
      </div>

      {/* Active check */}
      {isActive && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-shrink-0"
        >
          <Check
            size={14}
            strokeWidth={2.5}
            style={{ color: themeMeta.accent }}
          />
        </motion.span>
      )}
    </button>
  )
}
