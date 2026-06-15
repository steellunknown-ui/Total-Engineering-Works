'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, Download, Plus, X, Check, ChevronLeft, ChevronRight,
  Loader2, Building2, Mail, Phone, Globe, Tag, FileText, TrendingUp,
  BarChart3, Edit2, Calendar, Star, IndianRupee, RefreshCcw
} from 'lucide-react'
import {
  getCustomers, getCustomerDetail, createCustomer, updateCustomer, exportCustomers,
  CustomerListItem, CustomerDetail, CustomerListResponse,
} from '@/lib/api'

// ── Utility ───────────────────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const color: Record<string, string> = {
    'Accepted': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Pending Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Draft': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Sent': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${color[status] || 'bg-text-muted/10 text-text-muted border-border-default'}`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, sub, color = 'text-text-primary' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-bg-surface border border-border-hairline rounded-lg p-4">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <Check size={16} /> : <X size={16} />}
      {msg}
    </div>
  )
}

const LEAD_SOURCES = ['Manual Entry', 'Instant Estimate', 'Website', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other']

// ── Customer Detail Drawer ────────────────────────────────────────────────────

function CustomerDrawer({ customerId, onClose, onSaved }: { customerId: number; onClose: () => void; onSaved: () => void }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<CustomerDetail>>({})
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'rfqs' | 'quotes'>('overview')

  useEffect(() => {
    setLoading(true)
    getCustomerDetail(customerId).then(d => { setDetail(d); setLoading(false) })
  }, [customerId])

  const handleSave = async () => {
    if (!detail) return
    setSaving(true)
    await updateCustomer(detail.id, form as Partial<{ company_name: string; contact_person: string; email: string; phone: string; website: string; lead_source: string; notes: string }>)
    const updated = await getCustomerDetail(detail.id)
    setDetail(updated); setEditing(false); setSaving(false); onSaved()
  }

  const fieldVal = (k: keyof CustomerDetail) => String((form as any)[k] ?? (detail as any)?.[k] ?? '')
  const f = (k: keyof CustomerDetail) => editing ? (
    String(k) === 'notes' ? (
      <textarea value={fieldVal(k)} rows={3} onChange={e => setForm((p: any) => ({ ...p, [k]: e.target.value }))}
        className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none resize-none" />
    ) : String(k) === 'lead_source' ? (
      <select value={fieldVal(k)} onChange={e => setForm((p: any) => ({ ...p, [k]: e.target.value }))}
        className="w-full h-9 px-3 bg-bg-elevated border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none">
        {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
      </select>
    ) : (
      <input value={fieldVal(k)} onChange={e => setForm((p: any) => ({ ...p, [k]: e.target.value }))}
        className="w-full h-9 px-3 bg-bg-elevated border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none" />
    )
  ) : <span className="text-sm text-text-primary">{String((detail as any)?.[k] ?? '—')}</span>

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-xl bg-bg-elevated h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    </div>
  )

  if (!detail) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end backdrop-blur-sm">
      <div className="w-full max-w-xl bg-bg-elevated h-full flex flex-col shadow-2xl border-l border-border-hairline">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-hairline flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{detail.company_name}</h2>
            <p className="text-xs text-text-muted">{detail.contact_person} · {detail.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => { setEditing(true); setForm({}) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors">
                <Edit2 size={12} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white text-xs font-medium rounded disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface text-text-muted text-xs font-medium rounded border border-border-default transition-colors">
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary rounded hover:bg-bg-surface transition-colors"><X size={16} /></button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-0 border-b border-border-hairline flex-shrink-0">
          {[
            { label: 'RFQs', val: detail.rfq_count, color: 'text-blue-400' },
            { label: 'Quotes', val: detail.quote_count, color: 'text-accent-primary' },
            { label: 'Accepted', val: detail.accepted_count, color: 'text-emerald-400' },
            { label: `${detail.conversion_rate}%`, val: 'Conv.', color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center border-r last:border-r-0 border-border-hairline">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue Banner */}
        <div className="px-6 py-3 border-b border-border-hairline bg-emerald-500/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Total Revenue (Accepted)</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{detail.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-border-hairline px-6 flex-shrink-0">
          {(['overview', 'rfqs', 'quotes'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors -mb-px ${
                activeSection === s ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-text-primary'
              }`}>{s}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeSection === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Contact Person', k: 'contact_person' as const, icon: Users },
                  { label: 'Email', k: 'email' as const, icon: Mail },
                  { label: 'Phone', k: 'phone' as const, icon: Phone },
                  { label: 'Website', k: 'website' as const, icon: Globe },
                  { label: 'Lead Source', k: 'lead_source' as const, icon: Tag },
                ].map(({ label, k, icon: Icon }) => (
                  <div key={k} className={String(k) === 'email' ? 'col-span-2' : ''}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon size={11} className="text-text-muted" />
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</span>
                    </div>
                    {f(k)}
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText size={11} className="text-text-muted" />
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Notes</span>
                  </div>
                  {f('notes')}
                </div>
              </div>

              <div className="pt-4 border-t border-border-hairline space-y-2">
                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Engagement Insights</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-surface border border-border-hairline rounded p-3">
                    <div className="text-[10px] text-text-muted mb-1">Most Used Material</div>
                    <div className="text-sm font-semibold text-text-primary">{detail.most_used_material ?? '—'}</div>
                  </div>
                  <div className="bg-bg-surface border border-border-hairline rounded p-3">
                    <div className="text-[10px] text-text-muted mb-1">Most Used Thickness</div>
                    <div className="text-sm font-semibold text-text-primary">{detail.most_used_thickness ? `${detail.most_used_thickness}mm` : '—'}</div>
                  </div>
                  <div className="bg-bg-surface border border-border-hairline rounded p-3">
                    <div className="text-[10px] text-text-muted mb-1">Avg Quote Value</div>
                    <div className="text-sm font-semibold text-accent-primary">₹{detail.avg_quote_value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-bg-surface border border-border-hairline rounded p-3">
                    <div className="text-[10px] text-text-muted mb-1">Customer Since</div>
                    <div className="text-sm font-semibold text-text-primary">{new Date(detail.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'rfqs' && (
            <div className="space-y-2">
              {detail.rfqs.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">No RFQs yet</div>
              ) : detail.rfqs.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-bg-surface border border-border-hairline rounded p-3 hover:border-accent-primary/30 transition-colors">
                  <div>
                    <span className="text-sm font-mono font-medium text-text-primary">{r.rfq_number}</span>
                    {r.lead_source && <span className="ml-2 text-[10px] text-text-muted">{r.lead_source}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={r.status} />
                    <span className="text-[10px] text-text-muted">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'quotes' && (
            <div className="space-y-2">
              {detail.quotes.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">No quotes yet</div>
              ) : detail.quotes.map(q => (
                <div key={q.id} className="flex items-center justify-between bg-bg-surface border border-border-hairline rounded p-3 hover:border-accent-primary/30 transition-colors">
                  <div>
                    <span className="text-sm font-mono font-medium text-text-primary">{q.quote_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-accent-primary">₹{q.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                    <Badge status={q.status} />
                    <span className="text-[10px] text-text-muted">{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Customer Modal ────────────────────────────────────────────────────────

function AddCustomerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', website: '', lead_source: 'Manual Entry', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await createCustomer(form); onSaved(); onClose()
    } catch (e: any) { setError(e.message || 'Failed to create customer') }
    setSaving(false)
  }

  const inp = (label: string, k: keyof typeof form, type = 'text', required = false) => (
    <div>
      <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}{required && ' *'}</label>
      <input type={type} required={required} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
        className="w-full h-9 px-3 bg-bg-surface border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-bg-elevated border border-border-hairline rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-hairline">
          <h2 className="text-base font-bold text-text-primary">Add Customer</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-bg-surface transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {inp('Company Name', 'company_name', 'text', true)}
            {inp('Contact Person', 'contact_person', 'text', true)}
            {inp('Email', 'email', 'email', true)}
            {inp('Phone', 'phone', 'tel')}
            {inp('Website', 'website', 'url')}
            <div>
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Lead Source</label>
              <select value={form.lead_source} onChange={e => setForm(p => ({ ...p, lead_source: e.target.value }))}
                className="w-full h-9 px-3 bg-bg-surface border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none">
                {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
              className="w-full px-3 py-2 bg-bg-surface border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none resize-none" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-border-hairline">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-bg-surface border border-border-default text-sm text-text-secondary rounded hover:bg-bg-elevated transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-accent-primary text-white text-sm font-semibold rounded disabled:opacity-50 hover:bg-accent-primary-hover transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [data, setData] = useState<CustomerListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [leadFilter, setLeadFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [exporting, setExporting] = useState<'view' | 'all' | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCustomers(page, 20, search, leadFilter)
      setData(res)
    } catch { }
    setLoading(false)
  }, [page, search, leadFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const handleExport = async (all: boolean) => {
    setExporting(all ? 'all' : 'view')
    try {
      await exportCustomers(all, search, leadFilter)
      showToast(all ? 'All customers exported' : 'Current view exported')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setExporting(null)
  }

  const summary = data ? {
    total: data.total,
    totalRevenue: data.customers.reduce((s, c) => s + c.total_revenue, 0),
    avgConversion: data.customers.length > 0 ? (data.customers.reduce((s, c) => s + c.conversion_rate, 0) / data.customers.length).toFixed(1) : '0.0',
    totalRFQs: data.customers.reduce((s, c) => s + c.rfq_count, 0),
  } : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast {...toast} />}
      {selectedId && <CustomerDrawer customerId={selectedId} onClose={() => setSelectedId(null)} onSaved={load} />}
      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); showToast('Customer created') }} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">Customers</h1>
          <p className="font-sans text-[13px] text-text-secondary mt-1">CRM — manage all your customer accounts and engagement data.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleExport(false)} disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-surface border border-border-default text-text-secondary text-sm rounded hover:bg-bg-elevated hover:border-border-active disabled:opacity-50 transition-colors">
            {exporting === 'view' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export View
          </button>
          <button onClick={() => handleExport(true)} disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-surface border border-border-default text-text-secondary text-sm rounded hover:bg-bg-elevated hover:border-border-active disabled:opacity-50 transition-colors">
            {exporting === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export All
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white text-sm font-semibold rounded hover:bg-accent-primary-hover transition-colors shadow-lg shadow-accent-primary/20">
            <Plus size={14} /> Add Customer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Customers" value={summary.total} />
          <StatCard label="Total RFQs" value={summary.totalRFQs} />
          <StatCard label="Total Revenue" value={`₹${(summary.totalRevenue / 100000).toFixed(1)}L`} color="text-emerald-400" />
          <StatCard label="Avg Conversion" value={`${summary.avgConversion}%`} color="text-accent-primary" sub="Accepted vs Quoted" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by company, contact, or email…"
            className="w-full h-10 pl-9 pr-4 bg-bg-surface border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>
        <select value={leadFilter} onChange={e => { setLeadFilter(e.target.value); setPage(1) }}
          className="h-10 px-3 bg-bg-surface border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors min-w-[160px]">
          <option value="">All Lead Sources</option>
          {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setLeadFilter(''); setPage(1) }} title="Clear filters"
          className="h-10 w-10 flex items-center justify-center bg-bg-surface border border-border-default text-text-muted rounded hover:text-text-primary hover:border-border-active transition-colors">
          <RefreshCcw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-hairline rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-elevated/60 border-b border-border-hairline">
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-center">RFQs</th>
              <th className="px-4 py-3 text-center">Quotes</th>
              <th className="px-4 py-3 text-center">Accepted</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-center">Conv%</th>
              <th className="px-4 py-3 text-left">Lead Source</th>
              <th className="px-4 py-3 text-left">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3 bg-bg-elevated rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data?.customers.length ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <Users size={32} className="text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted text-sm">No customers found</p>
                  {search && <p className="text-text-muted text-xs mt-1">Try clearing your search filter</p>}
                </td>
              </tr>
            ) : data.customers.map(c => (
              <tr key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="hover:bg-bg-elevated/30 cursor-pointer transition-colors group">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{c.company_name}</div>
                  <div className="text-[11px] text-text-muted">{c.email}</div>
                </td>
                <td className="px-4 py-3.5 text-text-secondary">{c.contact_person}</td>
                <td className="px-4 py-3.5 text-center font-mono text-text-secondary">{c.rfq_count}</td>
                <td className="px-4 py-3.5 text-center font-mono text-text-secondary">{c.quote_count}</td>
                <td className="px-4 py-3.5 text-center font-mono text-emerald-400">{c.accepted_count}</td>
                <td className="px-4 py-3.5 text-right font-mono text-accent-primary">
                  {c.total_revenue > 0 ? `₹${c.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    c.conversion_rate >= 50 ? 'text-emerald-400' : c.conversion_rate >= 25 ? 'text-amber-400' : 'text-text-muted'
                  }`}>{c.conversion_rate}%</div>
                </td>
                <td className="px-4 py-3.5">
                  {c.lead_source && (
                    <span className="text-[10px] px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
                      {c.lead_source}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-[11px] text-text-muted">
                  {c.last_activity ? new Date(c.last_activity).toLocaleDateString('en-IN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-text-muted">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} customers
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-3 h-8 bg-bg-surface border border-border-default text-sm text-text-secondary rounded disabled:opacity-40 hover:bg-bg-elevated transition-colors">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs font-mono text-text-muted">
              {page} / {data.total_pages}
            </span>
            <button disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-3 h-8 bg-bg-surface border border-border-default text-sm text-text-secondary rounded disabled:opacity-40 hover:bg-bg-elevated transition-colors">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
