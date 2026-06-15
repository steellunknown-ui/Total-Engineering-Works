'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Download, Printer, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { generateQuotePdf, getQuotePdfUrl, PdfUrlResponse } from '@/lib/api'

interface QuotePdfModalProps {
  quoteId: number
  quoteNumber: string
  isOpen: boolean
  onClose: () => void
  onGenerated?: () => void
}

export function QuotePdfModal({ quoteId, quoteNumber, isOpen, onClose, onGenerated }: QuotePdfModalProps) {
  const [pdfData, setPdfData] = useState<PdfUrlResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [qualityStatus, setQualityStatus] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPdf()
    } else {
      // Reset state when closed
      setPdfData(null)
      setError(null)
      setWarnings([])
      setQualityStatus(null)
    }
  }, [isOpen, quoteId])

  const loadPdf = async () => {
    setLoading(true)
    setError(null)
    setWarnings([])
    setQualityStatus(null)
    try {
      const data = await getQuotePdfUrl(quoteId)
      setPdfData(data)
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('No PDF has been generated')) {
        // No PDF yet
        setPdfData(null)
      } else {
        setError(err.message || 'Failed to load PDF')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setWarnings([])
    setQualityStatus(null)
    try {
      const res = await generateQuotePdf(quoteId)
      setQualityStatus(res.quality_status)
      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings)
      }
      setPdfData({
        signed_url: res.signed_url,
        version: res.version,
        generated_at: res.generated_at,
        expires_in_seconds: 300,
      })
      if (onGenerated) onGenerated()
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF')
      // If it's a 422 with validation errors, try to extract them
      try {
        const detail = JSON.parse(err.message)
        if (detail.quality_status) {
          setQualityStatus(detail.quality_status)
          if (detail.warnings) setWarnings(detail.warnings)
          setError(detail.error || 'PDF Generation Failed')
        }
      } catch (e) {}
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl h-[90vh] bg-bg-surface border border-border-default shadow-2xl rounded flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-hairline bg-bg-elevated/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-text-primary font-sans leading-none">
                Quote PDF
              </h2>
              <p className="text-[12px] text-text-secondary mt-1 font-mono">
                {quoteNumber} {pdfData?.version ? `(v${pdfData.version})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Alerts */}
        {warnings.length > 0 && (
          <div className={`px-6 py-3 border-b flex flex-col gap-1 ${
            qualityStatus === 'FAIL' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
          }`}>
            <div className="flex items-center gap-2 font-bold text-[13px]">
              <AlertTriangle className="w-4 h-4" />
              Quality Validation: {qualityStatus}
            </div>
            <ul className="list-disc list-inside text-[12px] opacity-90 pl-6">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-bg-canvas relative flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
              <p className="text-text-secondary text-[13px]">Processing PDF...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
              <h3 className="text-[16px] font-bold text-text-primary mb-2">Error</h3>
              <p className="text-[13px] text-text-secondary max-w-md">{error}</p>
              <button
                onClick={handleGenerate}
                className="mt-6 px-4 py-2 bg-accent-primary text-white text-[13px] font-medium rounded hover:bg-accent-hover transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : pdfData?.signed_url ? (
            <iframe 
              src={pdfData.signed_url} 
              className="w-full h-full border-none"
              title={`Quote ${quoteNumber} PDF`}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <FileText className="w-16 h-16 text-text-muted mb-4 opacity-50" />
              <h3 className="text-[18px] font-bold text-text-primary mb-2">No PDF Generated</h3>
              <p className="text-[13px] text-text-secondary max-w-md mb-6">
                This quote does not have a generated PDF version yet. Generating a PDF will freeze the current layout and store it permanently.
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-accent-primary text-white text-[14px] font-medium rounded hover:bg-accent-hover transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Generate Professional PDF
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {pdfData?.signed_url && (
          <div className="px-6 py-4 border-t border-border-hairline bg-bg-surface flex items-center justify-between">
            <div className="text-[12px] text-text-secondary font-mono">
              Generated: {new Date(pdfData.generated_at!).toLocaleString()}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 bg-bg-elevated border border-border-default text-text-primary text-[13px] font-medium rounded hover:bg-bg-elevated/80 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
                Regenerate
              </button>
              <a
                href={pdfData.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-bg-elevated border border-border-default text-text-primary text-[13px] font-medium rounded hover:bg-bg-elevated/80 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </a>
              <a
                href={pdfData.signed_url}
                download={`${quoteNumber}.pdf`}
                className="px-4 py-2 bg-accent-primary text-white text-[13px] font-medium rounded hover:bg-accent-hover transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
