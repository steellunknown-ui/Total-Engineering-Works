import type { Variants, Transition } from 'framer-motion'

// ─── Easing Curves ─────────────────────────────────────────────────────────
// All easing in this project uses the industrial curve: fast start, precise arrival.
// Never use bounce, spring, or elastic easing. Never.

export const EASING = {
  industrial: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const

// ─── Duration Scale ────────────────────────────────────────────────────────
export const DURATION: Record<string, number> = {
  fast:   0.2,
  medium: 0.35,
  slow:   0.5,
}

// ─── Shared Transition Base ────────────────────────────────────────────────
const baseTransition = (duration = DURATION.slow): Transition => ({
  duration,
  ease: EASING.industrial,
})

// ─── Variants ──────────────────────────────────────────────────────────────

/**
 * Standard scroll-reveal: fade in with 16px upward travel.
 * Used for most section content and individual elements.
 */
export const fadeIn: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTransition(DURATION.slow),
  },
}

/**
 * More pronounced upward slide for hero elements and primary headings.
 */
export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTransition(DURATION.slow),
  },
}

/**
 * Stagger container — wraps a list of animated children.
 * Children must each use a motion variant (fadeIn or slideUp).
 */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren:   0.02,
    },
  },
}

/**
 * Navbar background transition: transparent → solid on scroll.
 * Uses generic values — Navbar computes actual bg colour from CSS vars at runtime.
 */
export const navBackground: Variants = {
  transparent: {
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderColor:     'rgba(255, 255, 255, 0)',
  },
  solid: {
    // We use a semi-opaque value; the actual base colour comes from CSS var
    // The Navbar applies a style override for the bg-var colour
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    borderColor:     'rgba(255, 255, 255, 0.07)',
    transition:      { duration: DURATION.fast, ease: 'easeOut' },
  },
}

/**
 * Form success state: subtle scale-in for the confirmation panel.
 */
export const formSuccess: Variants = {
  hidden:  { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale:   1,
    transition: baseTransition(DURATION.medium),
  },
}

/**
 * Hero entrance: stagger for label → headline → sub → CTA.
 * Use with staggerContainer as parent.
 */
export const heroEntrance: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTransition(DURATION.slow),
  },
}

/**
 * Mobile drawer: slides in from the right.
 */
export const drawerSlide: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: baseTransition(DURATION.medium),
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASING.industrial },
  },
}
