'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  LayoutDashboard, 
  FileText, 
  Calculator, 
  History, 
  Users, 
  Settings, 
  LogOut, 
  Menu 
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, active: pathname === '/admin/dashboard' },
    { name: 'RFQs', href: '/admin/rfqs', icon: FileText, active: pathname.startsWith('/admin/rfqs') },
    { name: 'Quote Tool', href: '/admin/quote-tool/new', icon: Calculator, active: pathname.startsWith('/admin/quote-tool/new'), disabled: false, description: '(Standalone)' },
    { name: 'Quote History', href: '/admin/quote-history', icon: History, active: pathname.startsWith('/admin/quote-history') },
    { name: 'Customers', href: '/admin/customers', icon: Users, active: pathname.startsWith('/admin/customers') },
    { name: 'Settings', href: '/admin/settings', icon: Settings, active: pathname.startsWith('/admin/settings') },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden font-sans">
      
      {/* Sidebar - Desktop (Supabase Style: Expand on Hover) */}
      <div className="hidden md:flex flex-col bg-bg-elevated border-r border-divider z-50 w-16 hover:w-64 transition-all duration-300 ease-in-out group overflow-x-hidden whitespace-nowrap">
        
        {/* Brand Header */}
        <div className="flex items-center h-16 px-4 bg-bg-base border-b border-divider flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-white/5 flex-shrink-0">
            <span className="text-lg font-bold text-white leading-none">T</span>
          </div>
          <span className="text-xl font-bold text-white tracking-wider ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            TATVA<span className="text-accent-primary">ERP</span>
          </span>
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-col flex-grow overflow-y-auto overflow-x-hidden pt-4 pb-4">
          <nav className="flex-1 px-2 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return item.disabled ? (
                <div
                  key={item.name}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-text-muted opacity-50 cursor-not-allowed"
                  title={item.name}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <div className="flex flex-col ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>{item.name}</span>
                    <span className="text-[10px] text-text-tertiary">{item.description}</span>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.active
                      ? 'bg-accent-primary text-white'
                      : 'text-text-primary hover:bg-bg-base hover:text-white'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* User Info & Logout */}
        <div className="flex-shrink-0 flex flex-col border-t border-divider p-2">
          
          {/* User Profile (Only visible on hover) */}
          <div className="flex items-center px-3 py-3 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary flex-shrink-0 font-bold text-xs uppercase">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center">
              <p className="text-sm font-medium text-white truncate w-40">{user?.email}</p>
              <p className="text-[10px] font-bold text-accent-primary uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Sign out
            </span>
          </button>
          
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 bg-bg-elevated border-b border-divider">
          <span className="text-xl font-bold text-white tracking-wider">TATVA<span className="text-accent-primary">ERP</span></span>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-text-primary hover:text-white focus:outline-none"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile menu panel */}
        {isSidebarOpen && (
          <div className="md:hidden bg-bg-elevated border-b border-divider p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return !item.disabled && (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-bg-base"
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-md"
            >
              <LogOut size={20} className="mr-3" />
              Sign out
            </button>
          </div>
        )}

        <main className="flex-1 min-h-0 relative overflow-y-auto focus:outline-none bg-black">
          <div className="py-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
