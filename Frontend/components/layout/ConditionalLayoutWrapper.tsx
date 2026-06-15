'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function ConditionalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Define routes that should NOT have the public Navbar/Footer
  const isAppRoute = pathname.startsWith('/admin') || pathname.startsWith('/login')

  if (isAppRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-[68px]">
        {children}
      </main>
      <Footer />
    </>
  )
}
