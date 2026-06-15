'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { FabSheetWorkspace } from '@/components/fab-sheet/FabSheetWorkspace'
import type { FabPartSpec } from '@/lib/api'

interface RFQQuoteData {
  rfq_id: number
  rfq_number: string
  status: string
  customer: {
    id: number
    company_name: string
    contact_person: string
    email: string
  }
  parsed_parts: FabPartSpec[]
  parse_errors: { file_name: string; reason: string }[]
  total_files: number
  parsed_count: number
}

function RFQContextBanner({ data, rfqId }: { data: RFQQuoteData; rfqId: string }) {
  return (
    <div className="border-b border-border-hairline bg-bg-surface/50">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <Link 
          href={`/admin/rfqs/${rfqId}`}
          className="inline-flex items-center gap-1 font-sans text-[12px] text-text-muted hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to RFQ Detail
        </Link>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] px-2 py-0.5 bg-bg-elevated border border-border-default rounded text-text-secondary">
                {data.rfq_number}
              </span>
              <span className="font-sans text-[12px] font-medium text-accent-primary uppercase tracking-widest">
                {data.status}
              </span>
            </div>
            <h1 className="font-sans text-[22px] font-bold tracking-tight text-text-primary mt-2">
              Quotation Workspace
            </h1>
            <p className="font-sans text-[14px] text-text-secondary mt-0.5">
              Customer: <span className="text-text-primary font-medium">{data.customer.company_name}</span> 
              <span className="text-text-muted mx-2">•</span> 
              {data.customer.contact_person}
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Files Parsed</p>
            <p className="font-sans text-[20px] font-bold text-text-primary mt-0.5">
              {data.parsed_count} <span className="text-text-muted text-[14px] font-normal">/ {data.total_files}</span>
            </p>
          </div>
        </div>

        {data.parse_errors && data.parse_errors.length > 0 && (
          <div className="mt-4 p-3 bg-accent-error/10 border border-accent-error/30 rounded flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-accent-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-[13px] font-medium text-accent-error">
                Some files could not be auto-parsed:
              </p>
              <ul className="mt-1 space-y-0.5">
                {data.parse_errors.map((err, i) => (
                  <li key={i} className="font-mono text-[11px] text-accent-error/80">
                    {err.file_name} — {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RFQQuotePage() {
  const params = useParams()
  const rfqId = params.id as string

  const [data, setData] = useState<RFQQuoteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuoteData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'}/api/admin/rfqs/${rfqId}/quote-data`, {
          credentials: 'include'
        })
        
        if (!res.ok) {
          throw new Error('Failed to load RFQ files')
        }
        
        const jsonData = await res.json()
        setData(jsonData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuoteData()
  }, [rfqId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        <p className="font-mono text-[12px] text-text-muted uppercase tracking-widest mt-4">
          Processing RFQ Files...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-bg-surface border border-accent-error/30 rounded p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-accent-error mx-auto mb-2" />
          <p className="font-sans text-[15px] font-medium text-text-primary">Failed to load quote data</p>
          <p className="font-mono text-[12px] text-accent-error">{error}</p>
          <Link 
            href={`/admin/rfqs/${rfqId}`}
            className="inline-block mt-4 px-5 py-2 bg-bg-elevated hover:bg-bg-surface text-text-primary text-[13px] font-semibold rounded border border-border-default transition-colors"
          >
            Back to RFQ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <FabSheetWorkspace
      initialParts={data.parsed_parts}
      lockedCustomer={data.customer.company_name}
      rfqId={data.rfq_id}
      customerId={data.customer.id}
      contextBanner={<RFQContextBanner data={data} rfqId={rfqId} />}
    />
  )
}
