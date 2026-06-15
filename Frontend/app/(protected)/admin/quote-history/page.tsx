'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Filter, Loader2, ChevronDown, Check, Send, XCircle, ArrowLeftCircle, CheckCircle2, FileDown } from 'lucide-react'
import { getQuoteHistory, QuoteHistoryItem, updateAdminQuoteStatus } from '@/lib/api'
import { QuotePdfModal } from '@/components/ui/QuotePdfModal'

export default function QuoteHistoryPage() {
  const [quotes, setQuotes] = useState<QuoteHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // PDF Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null)
  const [selectedQuoteNumber, setSelectedQuoteNumber] = useState('')

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const data = await getQuoteHistory(page, 20, search, statusFilter)
      setQuotes(data.quotes)
      setTotalPages(data.total_pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchQuotes()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search, statusFilter, page])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const handleStatusUpdate = async (quoteId: number, newStatus: string) => {
    setActionLoading(quoteId)
    try {
      await updateAdminQuoteStatus(quoteId, newStatus)
      await fetchQuotes()
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update quote status. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Draft': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      'Ready For Review': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'Approved': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Sent': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Accepted': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    const cls = colors[status] || colors['Draft']
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border ${cls}`}>
        {status}
      </span>
    )
  }

  const renderActions = (q: QuoteHistoryItem) => {
    if (actionLoading === q.id) {
      return <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
    }

    return (
      <div className="flex items-center justify-end gap-2">
        {q.status === 'Draft' && (
          <button onClick={() => handleStatusUpdate(q.id, 'Ready For Review')} className="text-[11px] px-2 py-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded border border-yellow-500/20 transition-colors">
            Submit for Review
          </button>
        )}
        {q.status === 'Ready For Review' && (
          <button onClick={() => handleStatusUpdate(q.id, 'Approved')} className="text-[11px] px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors">
            Approve
          </button>
        )}
        {q.status === 'Approved' && (
          <button onClick={() => handleStatusUpdate(q.id, 'Sent')} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded border border-purple-500/20 transition-colors">
            <Send className="w-3 h-3" /> Mark Sent
          </button>
        )}
        {q.status === 'Sent' && (
          <>
            <button onClick={() => handleStatusUpdate(q.id, 'Accepted')} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/20 transition-colors">
              <CheckCircle2 className="w-3 h-3" /> Accept
            </button>
            <button onClick={() => handleStatusUpdate(q.id, 'Rejected')} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors">
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </>
        )}
        {q.status === 'Rejected' && (
          <button onClick={() => handleStatusUpdate(q.id, 'Draft')} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20 rounded border border-neutral-500/20 transition-colors">
            <ArrowLeftCircle className="w-3 h-3" /> Recover to Draft
          </button>
        )}
        
        {/* Phase 7A: PDF Action (Available for Approved, Sent, Accepted) */}
        {['Approved', 'Sent', 'Accepted'].includes(q.status) && (
          <button 
            onClick={() => {
              setSelectedQuoteId(q.id)
              setSelectedQuoteNumber(q.quote_number)
              setPdfModalOpen(true)
            }} 
            className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 rounded border border-accent-primary/20 transition-colors"
          >
            <FileDown className="w-3 h-3" /> 
            {q.pdf_version ? 'View PDF' : 'Create PDF'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">
            Quotes
          </h1>
          <p className="font-sans text-[13px] text-text-secondary mt-1">
            History of all draft and finalized quotes
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by quote no, rfq, or customer..."
            value={search}
            onChange={handleSearchChange}
            className="w-full h-9 pl-9 pr-4 bg-bg-surface border border-border-default rounded-sharp text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="w-full h-9 pl-9 pr-8 appearance-none bg-bg-surface border border-border-default rounded-sharp text-[13px] text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Ready For Review">Ready For Review</option>
            <option value="Approved">Approved</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-hairline rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-bg-elevated/50 border-b border-border-hairline">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">Quote No</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">RFQ No</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">Customer</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted text-right">Grand Total</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">Created By</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">Date</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {loading && quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 text-accent-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <FileText className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="font-sans text-[14px] text-text-secondary">No quotes found</p>
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] font-medium text-text-primary">
                        {q.quote_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-bg-elevated border border-border-default rounded text-text-secondary">
                        {q.rfq_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-[13px] text-text-primary">
                      {q.customer_name}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-text-primary text-right">
                      ₹{q.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-4 py-3 font-sans text-[13px] text-text-secondary">
                      {q.created_by_name || 'System'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {renderActions(q)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center px-2">
          <p className="font-sans text-[13px] text-text-secondary">
            Page <span className="font-medium text-text-primary">{page}</span> of <span className="font-medium text-text-primary">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 h-8 bg-bg-surface border border-border-default text-[13px] font-medium text-text-primary rounded-sharp hover:bg-bg-elevated disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 h-8 bg-bg-surface border border-border-default text-[13px] font-medium text-text-primary rounded-sharp hover:bg-bg-elevated disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Phase 7A: PDF Modal */}
      {selectedQuoteId && (
        <QuotePdfModal
          isOpen={pdfModalOpen}
          quoteId={selectedQuoteId}
          quoteNumber={selectedQuoteNumber}
          onClose={() => {
            setPdfModalOpen(false)
            setSelectedQuoteId(null)
          }}
          onGenerated={() => {
            fetchQuotes() // Refresh table to show updated version numbers
          }}
        />
      )}

    </div>
  )
}
