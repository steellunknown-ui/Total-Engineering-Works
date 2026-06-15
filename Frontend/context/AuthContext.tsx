'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: number
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (userData: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    fetchMe()
  }, [])

  const fetchMe = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        // Must include credentials to send HttpOnly cookies
        credentials: 'include', 
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
