import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { siteConfig } from '@/config/site'
import { LenisProvider } from '@/components/layout/LenisProvider'
import { ThemeProvider } from '@/context/ThemeContext'
import { RFQModalProvider } from '@/context/RFQModalContext'
import { ImageLightboxProvider } from '@/context/ImageLightboxContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ConditionalLayoutWrapper } from '@/components/layout/ConditionalLayoutWrapper'
import { RFQModal } from '@/components/ui/RFQModal'
import { ScrollButton } from '@/components/ui/ScrollButton'
import { Chatbot } from '@/components/ui/Chatbot'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

// ─── Font Loading ──────────────────────────────────────────────────────────

const inter = Inter({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-inter',
  weight:   ['400', '500', '600', '700'],
  preload:  true,
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-ibm-plex-mono',
  weight:   ['400', '500', '600'],
  preload:  false,
})

// ─── SEO Metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default:  `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  keywords: [
    'precision manufacturing',
    'CNC machining India',
    'sheet metal fabrication',
    'electrical control panels',
    'industrial manufacturing',
    'defense manufacturing',
    'DMG MORI machining',
    'AMADA sheet metal',
    'ISO certified manufacturer',
    'Tandon Group',
    'Total Engineering Works',
    'TEW',
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         siteConfig.url,
    siteName:    siteConfig.name,
    title:       `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card:        'summary_large_image',
    title:       `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor:   '#0D0D0D',
  colorScheme:  'dark',
  width:        'device-width',
  initialScale: 1,
}

// ─── Zero-FOUC Theme Script ────────────────────────────────────────────────
// Runs before React hydrates — reads localStorage and sets data-theme on
// <html> so the page never flashes the wrong theme colours.

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('td-theme');
    var valid = ['midnight', 'amber', 'navy'];
    if (stored && valid.indexOf(stored) !== -1) {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'midnight');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'midnight');
  }
})();
`

// ─── Root Layout ───────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
      data-theme="midnight"
    >
      {/* Zero-FOUC theme init — must be first in <head> */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>

      <body className="bg-bg-base text-text-primary font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            <RFQModalProvider>
              <ImageLightboxProvider>
                <LenisProvider>
                  {/* Skip to content — accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-sharp"
                  >
                    Skip to main content
                  </a>

                <ConditionalLayoutWrapper>
                  {children}
                </ConditionalLayoutWrapper>

                <RFQModal />
                <ScrollButton />
                <Chatbot />
              </LenisProvider>
            </ImageLightboxProvider>
          </RFQModalProvider>
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
