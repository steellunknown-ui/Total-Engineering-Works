/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Colors: all map to CSS custom properties ──────────────────────
      // This is the core of the theme system. Every Tailwind colour class
      // (bg-bg-base, text-text-primary, border-border-hairline, etc.)
      // maps to a CSS var that changes when data-theme changes on <html>.
      colors: {
        bg: {
          void:          'var(--bg-void)',
          base:          'var(--bg-base)',
          surface:       'var(--bg-surface)',
          elevated:      'var(--bg-elevated)',
          'section-alt': 'var(--bg-section-alt)',
        },
        border: {
          hairline: 'var(--border-hairline)',
          default:  'var(--border-default)',
          active:   'var(--border-active)',
          accent:   'var(--border-accent)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
        accent: {
          primary:        'var(--accent-primary)',
          'primary-hover':'var(--accent-primary-hover)',
          steel:          'var(--accent-steel)',
          gold:           'var(--accent-gold)',
          error:          'var(--accent-error)',
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // Display / Hero scale — cinematic editorial
        'display':     ['clamp(56px,8vw,96px)',  { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'display-md':  ['clamp(42px,6vw,72px)',  { lineHeight: '1.04', letterSpacing: '-0.035em' }],
        'display-sm':  ['clamp(32px,5vw,52px)',  { lineHeight: '1.06', letterSpacing: '-0.03em' }],

        // Kept for backward-compat
        'hero':        ['clamp(56px,8vw,96px)',  { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'hero-md':     ['clamp(42px,6vw,72px)',  { lineHeight: '1.04', letterSpacing: '-0.035em' }],
        'hero-sm':     ['clamp(32px,5vw,52px)',  { lineHeight: '1.06', letterSpacing: '-0.03em' }],

        // Section headings
        'section-h':   ['clamp(28px,4vw,52px)',  { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'section-h-md':['clamp(24px,3.5vw,40px)',{ lineHeight: '1.10', letterSpacing: '-0.02em' }],
        'section-h-sm':['clamp(22px,3vw,32px)',  { lineHeight: '1.12', letterSpacing: '-0.015em' }],

        // Component typography
        'card-title':  ['20px',  { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'body-lg':     ['19px',  { lineHeight: '1.65' }],
        'body':        ['17px',  { lineHeight: '1.70' }],
        'label':       ['11px',  { lineHeight: '1.0',  letterSpacing: '0.12em' }],
        'caption':     ['13px',  { lineHeight: '1.5'  }],
        'cta':         ['15px',  { lineHeight: '1.0',  letterSpacing: '0.01em' }],
        'spec':        ['13px',  { lineHeight: '1.6'  }],
        'spec-sm':     ['12px',  { lineHeight: '1.5'  }],
        'number-lg':   ['clamp(40px,5vw,64px)',  { lineHeight: '1.0',  letterSpacing: '-0.03em' }],
        'number-lg-md':['clamp(32px,4vw,48px)',  { lineHeight: '1.0',  letterSpacing: '-0.025em' }],
        'number-unit': ['24px',  { lineHeight: '1.0' }],
      },

      spacing: {
        'section':     '160px',
        'section-sm':  '96px',
        'section-xs':  '56px',
        'container-x': '80px',
      },

      maxWidth: {
        'container':    '1200px',
        'reading':      '68ch',
        'headline':     '20ch',
        'headline-sm':  '16ch',
      },

      borderRadius: {
        'sharp': '2px',
        'cta':   '6px',
        DEFAULT: '4px',
      },

      screens: {
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1440px',
      },

      // Gradients reference CSS vars
      backgroundImage: {
        'hero-gradient':    'var(--hero-gradient)',
        'section-gradient': 'var(--section-gradient)',
      },

      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'theme-pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },

      animation: {
        'fade-up':   'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in':   'fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'theme-pop': 'theme-pop 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
