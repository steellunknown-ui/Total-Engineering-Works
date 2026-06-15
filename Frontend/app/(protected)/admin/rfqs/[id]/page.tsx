'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  ArrowLeft,
  FileText,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Paperclip,
  Download,
  AlertTriangle,
  Loader2,
  FileX,
  Hash,
  Trash2,
  Archive,
  X,
} from 'lucide-react'

// ─── API Base ─────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RFQFile {
  id: number
  file_name: string
  file_type: string
  storage_path: string
  uploaded_at: string
  storage_status?: string
  archived_at?: string
  archived_reason?: string
}

interface RFQCustomer {
  id: number
  company_name: string
  contact_person: string
  email: string
  phone: string | null
}

interface RFQDetail {
  rfq_id: number
  rfq_number: string
  status: string
  project_description: string | null
  created_at: string
  customer: RFQCustomer
  files: RFQFile[]
}

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
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold tracking-wide uppercase ${cls}`}>
      {status}
    </span>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
          {label}
        </p>
        <p className={`text-sm text-white break-words ${mono ? 'font-mono tracking-wide text-accent-primary' : ''}`}>
          {value ?? <span className="text-text-muted italic">—</span>}
        </p>
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-bg-elevated border border-white/[0.08] rounded-lg overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.07] bg-bg-base/40">
        <Icon size={15} className="text-accent-primary flex-shrink-0" />
        <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
      </div>
      {/* Card Body */}
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

// ─── Action Modal ─────────────────────────────────────────────────────────────

function ActionModal({
  isOpen,
  type,
  file,
  onClose,
  onConfirm,
  isProcessing
}: {
  isOpen: boolean
  type: 'archive' | 'delete'
  file: RFQFile | null
  onClose: () => void
  onConfirm: () => void
  isProcessing: boolean
}) {
  if (!isOpen || !file) return null

  const isArchive = type === 'archive'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-bg-elevated border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-white/5 flex items-center gap-3 ${isArchive ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
            <div className={`p-2 rounded-full ${isArchive ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                {isArchive ? <Archive size={20} /> : <Trash2 size={20} />}
            </div>
            <div className="flex-1">
                <h3 className={`font-semibold ${isArchive ? 'text-amber-400' : 'text-red-400'}`}>
                    {isArchive ? 'Archive File' : 'Permanently Delete File'}
                </h3>
            </div>
            <button onClick={onClose} disabled={isProcessing} className="p-1 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X size={18} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">
                {isArchive ? (
                    <>
                        Are you sure you want to archive <strong className="text-white">{file.file_name}</strong>? 
                        <br/><br/>
                        The file will be moved to the <code className="px-1.5 py-0.5 bg-white/10 rounded text-accent-primary text-xs font-mono">archive/</code> folder in your Supabase storage bucket. It will remain securely stored but will be removed from your active workspace.
                    </>
                ) : (
                    <>
                        Are you sure you want to permanently delete <strong className="text-white">{file.file_name}</strong>?
                        <br/><br/>
                        <span className="text-red-400 font-medium">This action cannot be undone.</span> The file will be completely wiped from the storage bucket.
                    </>
                )}
            </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-base/50 border-t border-white/5 flex justify-end gap-3">
            <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                    isArchive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
                }`}
            >
                {isProcessing && <Loader2 size={14} className="animate-spin" />}
                {isProcessing ? 'Processing...' : (isArchive ? 'Archive File' : 'Delete File')}
            </button>
        </div>
      </div>
    </div>
  )
}

// ─── File Row ────────────────────────────────────────────────────────────────

function FileRow({
  file,
  rfqId,
  onDownload,
  onArchiveClick,
  onDeleteClick,
}: {
  file: RFQFile
  rfqId: number
  onDownload: (fileId: number, fileName: string) => void
  onArchiveClick: (file: RFQFile) => void
  onDeleteClick: (file: RFQFile) => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    await onDownload(file.id, file.file_name)
    setIsDownloading(false)
  }

  const ext = file.file_type?.replace('.', '').toUpperCase() || 'FILE'

  const extColors: Record<string, string> = {
    PDF:  'bg-red-500/15 text-red-400',
    DXF:  'bg-blue-500/15 text-blue-400',
    DWG:  'bg-indigo-500/15 text-indigo-400',
    STEP: 'bg-purple-500/15 text-purple-400',
    STP:  'bg-purple-500/15 text-purple-400',
    ZIP:  'bg-yellow-500/15 text-yellow-400',
  }
  const extColor = extColors[ext] ?? 'bg-white/10 text-text-secondary'

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const currentStatus = file.storage_status || 'active'
  const isDeleted = currentStatus === 'deleted'
  const isArchived = currentStatus === 'archived'

  return (
    <div className={`flex items-center gap-4 py-3 border-b border-white/[0.05] last:border-0 ${isDeleted ? 'opacity-50' : ''}`}>
      {/* File type badge */}
      <div className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded text-[10px] font-bold ${extColor}`}>
        {ext.slice(0, 4)}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${isDeleted ? 'line-through text-text-muted' : 'text-white'}`}>{file.file_name}</p>
            {isArchived && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Archived</span>}
            {isDeleted && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">Deleted</span>}
        </div>
        <p className="text-xs text-text-muted mt-0.5 tabular-nums">
          Uploaded {formatDate(file.uploaded_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isDeleted && (
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                title={`Download ${file.file_name}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-white/[0.10] text-text-secondary bg-white/[0.03] hover:bg-accent-primary/10 hover:text-white hover:border-accent-primary/30 disabled:opacity-40 disabled:cursor-wait transition-colors"
            >
                {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {isDownloading ? '...' : 'Download'}
            </button>
        )}
        {currentStatus === 'active' && (
            <button
                onClick={() => onArchiveClick(file)}
                title="Archive File"
                className="p-1.5 rounded text-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
            >
                <Archive size={14} />
            </button>
        )}
        {!isDeleted && (
            <button
                onClick={() => onDeleteClick(file)}
                title="Permanently Delete"
                className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
                <Trash2 size={14} />
            </button>
        )}
      </div>
    </div>
  )
}

// ─── 404 State ────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">RFQ Not Found</h2>
        <p className="text-sm text-text-muted max-w-xs">
          The requested RFQ does not exist or may have been removed.
        </p>
      </div>
      <Link
        href="/admin/rfqs"
        className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border border-white/[0.10] text-text-secondary hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to RFQ Inbox
      </Link>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-white/[0.06] rounded" />
      {/* Title row */}
      <div className="flex items-center gap-4">
        <div className="h-6 w-40 bg-white/[0.06] rounded" />
        <div className="h-6 w-24 bg-white/[0.06] rounded" />
      </div>
      {/* Cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-bg-elevated border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="h-11 bg-bg-base/40 border-b border-white/[0.07]" />
          <div className="px-5 py-4 space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-white/[0.04] rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()
  const rfqId = params?.id as string

  const [rfq, setRfq] = useState<RFQDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch RFQ detail
  const fetchDetail = useCallback(async () => {
    if (!rfqId) return
    setIsLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const res = await fetch(`${API_BASE}/api/admin/rfqs/${rfqId}`, {
        credentials: 'include',
      })

      if (res.status === 401) {
        router.push(`/login?callbackUrl=/admin/rfqs/${rfqId}`)
        return
      }
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.detail ?? `HTTP ${res.status}`)
      }

      const data: RFQDetail = await res.json()
      setRfq(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load RFQ')
    } finally {
      setIsLoading(false)
    }
  }, [rfqId, router])

  useEffect(() => {
    if (!authLoading) {
      fetchDetail()
    }
  }, [fetchDetail, authLoading])

  // Handle file download — fetches signed URL from backend, then triggers browser download
  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/rfqs/${rfqId}/files/${fileId}/download`,
        { credentials: 'include' }
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        alert(`Download failed: ${errData?.detail ?? `HTTP ${res.status}`}`)
        return
      }
      const { signed_url } = await res.json()
      // Open signed URL in new tab — browser handles the download
      const a = document.createElement('a')
      a.href = signed_url
      a.download = fileName
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      alert('Could not initiate download. Please try again.')
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const [modalState, setModalState] = useState<{isOpen: boolean, type: 'archive'|'delete', file: RFQFile | null}>({
      isOpen: false, type: 'archive', file: null
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirmAction = async () => {
      if (!modalState.file) return
      setIsProcessing(true)
      
      const fileId = modalState.file.id
      const endpoint = modalState.type === 'archive' ? 'archive' : 'delete'
      
      try {
          const res = await fetch(`${API_BASE}/api/admin/rfq-files/${fileId}/${endpoint}`, {
              method: 'POST',
              credentials: 'include',
          })
          if (!res.ok) {
              const errData = await res.json().catch(() => null)
              alert(`${modalState.type === 'archive' ? 'Archive' : 'Delete'} failed: ${errData?.detail ?? `HTTP ${res.status}`}`)
          } else {
              await fetchDetail() // reload to show badge
              setModalState(prev => ({...prev, isOpen: false}))
          }
      } catch(err) {
          alert(`Failed to ${modalState.type} file.`)
      } finally {
          setIsProcessing(false)
      }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (isLoading) return <DetailSkeleton />
  if (notFound)  return <NotFound />

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/rfqs"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          RFQ Inbox
        </Link>
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300">Failed to load RFQ</p>
            <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchDetail}
            className="ml-auto text-xs text-red-300 underline underline-offset-2 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!rfq) return null

  // ── Full detail view ───────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl space-y-5">

      {/* Breadcrumb + Back */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/admin/rfqs" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={12} />
          RFQ Inbox
        </Link>
        <span>/</span>
        <span className="font-mono text-accent-primary">{rfq.rfq_number}</span>
      </div>

      {/* Page Title Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <FileText size={20} className="text-accent-primary flex-shrink-0" />
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {rfq.rfq_number}
          </h1>
        </div>
        <StatusBadge status={rfq.status} />
        <span className="ml-auto text-xs text-text-muted tabular-nums hidden sm:block">
          Submitted {formatDate(rfq.created_at)}
        </span>
        <Link
          href={`/admin/rfqs/${rfq.rfq_id}/quote`}
          className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white text-[13px] font-semibold rounded transition-colors"
        >
          Open Quote Tool
        </Link>
      </div>

      {/* ── Section 1: RFQ Information ───────────────────────────────────── */}
      <SectionCard title="RFQ Information" icon={Hash}>
        <InfoRow icon={Hash}     label="RFQ Number"   value={rfq.rfq_number} mono />
        <InfoRow icon={Calendar} label="Created"       value={formatDate(rfq.created_at)} />
        <InfoRow
          icon={FileText}
          label="Project Description"
          value={
            rfq.project_description
              ? rfq.project_description
              : <span className="text-text-muted italic text-xs">No description provided.</span>
          }
        />
      </SectionCard>

      {/* ── Section 2: Customer Information ─────────────────────────────── */}
      <SectionCard title="Customer Information" icon={Building2}>
        <InfoRow icon={Building2} label="Company Name"   value={rfq.customer.company_name} />
        <InfoRow icon={User}      label="Contact Person" value={rfq.customer.contact_person} />
        <InfoRow icon={Mail}      label="Email"          value={
          <a
            href={`mailto:${rfq.customer.email}`}
            className="text-accent-primary hover:underline underline-offset-2 transition-colors"
          >
            {rfq.customer.email}
          </a>
        } />
        <InfoRow icon={Phone} label="Phone" value={rfq.customer.phone || undefined} />
      </SectionCard>

      {/* ── Section 3: Uploaded Files ────────────────────────────────────── */}
      <SectionCard title={`Uploaded Files (${rfq.files.length})`} icon={Paperclip}>
        {rfq.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <FileX size={28} className="text-text-muted" />
            <p className="text-sm text-text-muted">No files uploaded with this RFQ.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] py-1">
            {rfq.files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                rfqId={rfq.rfq_id}
                onDownload={handleDownload}
                onArchiveClick={(f) => setModalState({isOpen: true, type: 'archive', file: f})}
                onDeleteClick={(f) => setModalState({isOpen: true, type: 'delete', file: f})}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <ActionModal
          isOpen={modalState.isOpen}
          type={modalState.type}
          file={modalState.file}
          onClose={() => setModalState(prev => ({...prev, isOpen: false}))}
          onConfirm={handleConfirmAction}
          isProcessing={isProcessing}
      />
    </div>
  )
}
