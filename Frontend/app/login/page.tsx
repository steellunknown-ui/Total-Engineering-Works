'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        login(data.user)
        router.push('/admin/dashboard')
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Invalid email or password')
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-black bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/bg-manufacturing.png')",
      }}
    >
      {/* Dark gradient overlay to ensure text contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/80 pointer-events-none"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-5xl font-extrabold text-white tracking-tight drop-shadow-2xl">
          TEW<span className="text-accent-primary">ERP</span>
        </h2>
        <p className="mt-3 text-center text-sm text-white/80 font-medium tracking-wide">
          SECURE ADMIN PORTAL
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Intense Glassmorphism Container */}
        <div className="bg-white/[0.08] backdrop-blur-2xl py-10 px-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-2xl sm:px-10 border border-white/[0.15] relative overflow-hidden">
          
          {/* Decorative shine effect for glass */}
          <div className="absolute top-0 left-[-100%] w-[200%] h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent transform -rotate-12 pointer-events-none"></div>

          <form className="space-y-6 relative z-20" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white/90">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg shadow-inner placeholder-white/30 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all sm:text-sm backdrop-blur-md"
                  placeholder="admin@tew.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-semibold text-white/90">
                  Password
                </label>
                <button type="button" className="text-sm font-semibold text-accent-primary hover:text-white transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg shadow-inner placeholder-white/30 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all sm:text-sm backdrop-blur-md pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-200 text-sm font-medium p-3 bg-red-900/50 border border-red-500/50 rounded-lg backdrop-blur-md shadow-inner text-center">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-accent-primary hover:bg-accent-primary/90 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent-primary disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-200"
              >
                {loading ? 'Authenticating...' : 'Secure Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

