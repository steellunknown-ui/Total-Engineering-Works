'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  // Disable smooth scrolling for the dashboard/admin panel since it uses internal scrollbars
  const isAppRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/login')

  useEffect(() => {
    if (isAppRoute) return

    const lenis = new Lenis({
      duration:         1.0,
      easing:           (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation:      'vertical',
      smoothWheel:      true,
      wheelMultiplier:  1.0,
      touchMultiplier:  1.5,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [isAppRoute])

  return <>{children}</>
}
