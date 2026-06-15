'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  SlidersHorizontal,
  Eye,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface RFQItem {
  rfq_id: number
  rfq_number: string
  company_name: string
  contact_person: string
  email: string
  status: string
  created_at: string
  file_count: number
  customer_id: number
}

interface RFQListResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  rfqs: RFQItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

const STATUS_OPTIONS = [
  { value: 'all',           label: 'All Statuses' },
  { value: 'Pending Review', label: 'Pending Review' },
  { value: 'In Review',     label: 'In Review' },
  { value: 'Quoted',        label: 'Quoted' },
  { value: 'Rejected',      label: 'Rejected' },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Pending Review': 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    'In Review':      'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    'Quoted':         'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    'Rejected':       'bg-red-500/15 text-red-400 border border-red-500/25',
  }
  const cls = styles[status] ?? 'bg-white/5 text-text-secondary border border-white/10'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide uppercase ${cls}`}>
      {status}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RFQsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // State
  const [rfqs, setRfqs] = useState<RFQItem[]>([])
  const [meta, setMeta] = useState<Omit<RFQListResponse, 'rfqs'>>({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Debounce search input (500 ms) — so backend is not called on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  // Fetch RFQs
  const fetchRFQs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', '20')
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`${API_BASE}/api/admin/rfqs?${params.toString()}`, {
        credentials: 'include',
      })

      if (res.status === 401) {
        router.push('/login?callbackUrl=/admin/rfqs')
        return
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.detail ?? `HTTP ${res.status}`)
      }

      const data: RFQListResponse = await res.json()
      setRfqs(data.rfqs)
      setMeta({
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: data.total_pages,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load RFQs')
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, router])

  useEffect(() => {
    if (!authLoading) {
      fetchRFQs()
    }
  }, [fetchRFQs, authLoading])

  // Format ISO date to readable string
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full">

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FileText size={22} className="text-accent-primary" />
          <h1 className="text-xl font-semibold text-white tracking-tight">
            RFQ Inbox
          </h1>
        </div>
        <p className="text-sm text-text-muted ml-9">
          All incoming requests for quotation — sorted by most recent.
        </p>
      </div>

      {/* Toolbar: Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            id="rfq-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by RFQ number, company, or email…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-elevated border border-white/10 rounded text-white placeholder-text-muted focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-text-muted flex-shrink-0" />
          <select
            id="rfq-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-bg-elevated border border-white/10 rounded text-white px-3 py-2 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Record count */}
        {!isLoading && (
          <div className="flex items-center ml-auto text-xs text-text-muted tabular-nums whitespace-nowrap self-center">
            {meta.total === 0
              ? 'No records'
              : `${meta.total} record${meta.total !== 1 ? 's' : ''}`}
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-bg-elevated border border-white/[0.08] rounded-lg overflow-hidden">

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border-b border-red-500/20 text-sm text-red-400">
            <span className="font-semibold">Error:</span> {error}
            <button
              onClick={fetchRFQs}
              className="ml-auto underline underline-offset-2 hover:text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" id="rfq-table">
            <thead>
              <tr className="border-b border-white/[0.07] bg-bg-base/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                  RFQ Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                  Contact Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Files
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">

              {/* Loading Skeleton */}
              {isLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-3.5 bg-white/[0.06] rounded"
                          style={{ width: j === 4 ? '32px' : j === 7 ? '60px' : `${60 + (j * 17) % 40}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {/* Data Rows */}
              {!isLoading && rfqs.map((rfq) => (
                <tr
                  key={rfq.rfq_id}
                  className="hover:bg-white/[0.025] transition-colors group"
                >
                  {/* RFQ Number */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-accent-primary tracking-wide">
                      {rfq.rfq_number}
                    </span>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-white">
                      {rfq.company_name}
                    </span>
                  </td>

                  {/* Contact Person */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-text-secondary">
                      {rfq.contact_person}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-text-secondary text-xs">
                      {rfq.email}
                    </span>
                  </td>

                  {/* File Count */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded text-xs font-semibold tabular-nums ${rfq.file_count > 0 ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-muted'}`}>
                      {rfq.file_count}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={rfq.status} />
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-text-muted text-xs tabular-nums">
                      {formatDate(rfq.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-center">
                    <Link
                      id={`rfq-view-${rfq.rfq_id}`}
                      href={`/admin/rfqs/${rfq.rfq_id}`}
                      title={`View RFQ ${rfq.rfq_number}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-text-secondary border border-white/[0.08] bg-white/[0.03] hover:bg-accent-primary/10 hover:text-white hover:border-accent-primary/30 transition-colors"
                    >
                      <Eye size={13} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {!isLoading && !error && rfqs.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08]">
                        <Inbox size={26} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-secondary mb-1">
                          {debouncedSearch || statusFilter !== 'all'
                            ? 'No RFQs match your filters'
                            : 'No RFQs have been submitted yet'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {debouncedSearch || statusFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'RFQs submitted through the public form will appear here.'}
                        </p>
                      </div>
                      {(debouncedSearch || statusFilter !== 'all') && (
                        <button
                          onClick={() => { setSearch(''); setStatusFilter('all') }}
                          className="text-xs text-accent-primary hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.07] bg-bg-base/30">

            {/* Showing X–Y of Z */}
            <p className="text-xs text-text-muted tabular-nums">
              Showing{' '}
              <span className="text-text-secondary font-medium">
                {(meta.page - 1) * meta.page_size + 1}
              </span>
              {' '}–{' '}
              <span className="text-text-secondary font-medium">
                {Math.min(meta.page * meta.page_size, meta.total)}
              </span>
              {' '}of{' '}
              <span className="text-text-secondary font-medium">{meta.total}</span>
            </p>

            {/* Page Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted tabular-nums">
                Page {meta.page} of {meta.total_pages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  id="rfq-page-prev"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="flex items-center justify-center w-7 h-7 rounded border border-white/[0.08] text-text-secondary hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  id="rfq-page-next"
                  onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={meta.page >= meta.total_pages}
                  className="flex items-center justify-center w-7 h-7 rounded border border-white/[0.08] text-text-secondary hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
