'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ModalMode = 'rfq' | 'enquiry' | 'visit'

interface RFQModalContextType {
  isOpen: boolean
  mode: ModalMode
  openModal: (mode?: ModalMode) => void
  closeModal: () => void
}

const RFQModalContext = createContext<RFQModalContextType | undefined>(undefined)

export function RFQModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('rfq')

  const openModal = (newMode: ModalMode = 'rfq') => {
    setMode(newMode)
    setIsOpen(true)
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsOpen(false)
    // Restore background scrolling
    document.body.style.overflow = ''
  }

  return (
    <RFQModalContext.Provider value={{ isOpen, mode, openModal, closeModal }}>
      {children}
    </RFQModalContext.Provider>
  )
}

export function useRFQModal() {
  const context = useContext(RFQModalContext)
  if (context === undefined) {
    throw new Error('useRFQModal must be used within an RFQModalProvider')
  }
  return context
}
