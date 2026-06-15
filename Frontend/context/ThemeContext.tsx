'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

// ─── Theme Definitions ──────────────────────────────────────────────────────

export type ThemeId = 'midnight' | 'amber' | 'navy'

export interface ThemeMeta {
  id:          ThemeId
  name:        string
  description: string
  accent:      string  // hex for the UI swatch dot
  bg:          string  // hex for the bg swatch dot
  surface:     string  // hex for second swatch dot
}

export const THEMES: ThemeMeta[] = [
  {
    id:          'midnight',
    name:        'Midnight',
    description: 'Pure black · Cobalt blue',
    accent:      '#007AFF',
    bg:          '#0D0D0D',
    surface:     '#1A1A1A',
  },
  {
    id:          'amber',
    name:        'Industrial',
    description: 'Dark slate · Amber gold',
    accent:      '#D4821A',
    bg:          '#111418',
    surface:     '#191E24',
  },
  {
    id:          'navy',
    name:        'Navy',
    description: 'Deep navy · Tech blue',
    accent:      '#1A6FE8',
    bg:          '#061020',
    surface:     '#0A1B30',
  },
]

// ─── Context ────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:     ThemeMeta
  setTheme:  (id: ThemeId) => void
  themes:    ThemeMeta[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'td-theme'
const DEFAULT_THEME: ThemeId = 'midnight'

// ─── Provider ───────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME)

  // On mount: read from localStorage, apply to <html>
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
      if (stored && THEMES.some((t) => t.id === stored)) {
        setThemeId(stored)
        document.documentElement.setAttribute('data-theme', stored)
      } else {
        document.documentElement.setAttribute('data-theme', DEFAULT_THEME)
      }
    } catch {
      document.documentElement.setAttribute('data-theme', DEFAULT_THEME)
    }
  }, [])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
    document.documentElement.setAttribute('data-theme', id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Private browsing — silently ignore
    }
  }, [])

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
