'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

interface DashboardStats {
  pending_rfqs: number
  quoted_rfqs: number
  total_rfqs: number
  conversion_rate: number
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [authLoading])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric Cards */}
        <div className="bg-bg-elevated overflow-hidden shadow rounded-lg border border-divider">
          <div className="p-5">
            <div className="flex items-center">
              <div className="w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Pending RFQs</dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mt-2 opacity-50" /> : stats?.pending_rfqs ?? 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-elevated overflow-hidden shadow rounded-lg border border-divider">
          <div className="p-5">
            <div className="flex items-center">
              <div className="w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Quotes Generated</dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mt-2 opacity-50" /> : stats?.quoted_rfqs ?? 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-elevated overflow-hidden shadow rounded-lg border border-divider">
          <div className="p-5">
            <div className="flex items-center">
              <div className="w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-muted truncate">Conversion Rate</dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mt-2 opacity-50" /> : `${stats?.conversion_rate ?? 0}%`}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed Placeholder */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-white mb-4">Recent Activity</h2>
        <div className="bg-bg-elevated shadow rounded-lg border border-divider h-64 flex items-center justify-center">
          <p className="text-text-muted">No recent activity.</p>
        </div>
      </div>
    </div>
  )
}
