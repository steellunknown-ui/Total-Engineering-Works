'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload, X, CheckCircle2, AlertCircle, Trash2, Plus, Save, FileUp, Settings, List, Play, ChevronRight, File, Loader2, FileDown
} from 'lucide-react'
import {
  uploadFabFile, getConstants,
  generateEstimate, createDraftQuote, exportApproxPdf, exportExcelBOM,
  type FabPartSpec, type FabUploadResult, type ConstantsData,
  type EstimateResponse, type EstimateRequestItem
} from '@/lib/api'

export interface FabSheetWorkspaceProps {
  initialParts?: FabPartSpec[]
  lockedCustomer?: string
  rfqId?: number
  customerId?: number
  contextBanner?: React.ReactNode
}

type Step = 1 | 2 | 3

export function FabSheetWorkspace({ initialParts, lockedCustomer, rfqId, customerId, contextBanner }: FabSheetWorkspaceProps) {
  const [step, setStep] = useState<Step>(initialParts && initialParts.length > 0 ? 2 : 1)
  
  // Step 1: Upload
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null)
  
  // Step 2: Grid Data
  const [parts, setParts] = useState<FabPartSpec[]>(initialParts || [])
  const [customer, setCustomer] = useState(lockedCustomer || '')
  const [constants, setConstants] = useState<ConstantsData | null>(null)
  
  const [hasNormalized, setHasNormalized] = useState(false)
  
  useEffect(() => {
    getConstants().then(c => {
      setConstants(c)
      // Normalize initial parts just like uploaded files
      if (initialParts && initialParts.length > 0 && !hasNormalized) {
        const normalizeMap: Record<string, string> = {
          'crca': 'CRCA', 'cr sheet': 'CR Sheet', 'hr sheet': 'HR Sheet',
          'ms sheet': 'MS Sheet', 'gi sheet': 'GI Sheet',
          'cr': 'CR Sheet', 'hr': 'HR Sheet', 'ms': 'MS Sheet', 'gi': 'GI Sheet',
        }
        const normalized = initialParts.map(p => {
          const rawMaterial = (p.material || '').trim()
          const normalizedMaterial = c.materials.find(
            m => m.toLowerCase() === rawMaterial.toLowerCase()
          ) || normalizeMap[rawMaterial.toLowerCase()] || rawMaterial

          const detectedThickness = Number(p.thickness_mm) || 0
          const availableThicknesses: number[] = detectedThickness > 0 && normalizedMaterial && c.thicknesses[normalizedMaterial]
            ? c.thicknesses[normalizedMaterial]
            : []
          const matchedThickness = detectedThickness > 0 && availableThicknesses.length > 0
            ? availableThicknesses.reduce((prev, curr) =>
                Math.abs(curr - detectedThickness) < Math.abs(prev - detectedThickness) ? curr : prev
              )
            : detectedThickness

          const hasMaterial = !!normalizedMaterial && !!(c.materials.includes(normalizedMaterial))
          const hasThickness = matchedThickness > 0
          const hasLength = Number(p.length_mm) > 0
          const hasWidth = Number(p.width_mm) > 0

          return {
            ...p,
            material: normalizedMaterial,
            thickness_mm: matchedThickness,
            do_bend: p.do_bend || (p.process || '').toLowerCase().includes('bend'),
            do_weld: p.do_weld || (p.process || '').toLowerCase().includes('weld'),
            do_powder_dual: p.do_powder_dual || (p.process || '').toLowerCase().includes('powder') || (p.process || '').toLowerCase().includes('pc'),
            qty: p.qty || 1,
            rfq_file_id: p.rfq_file_id,
            autoDetected: {
              material: hasMaterial,
              thickness_mm: hasThickness,
              length_mm: hasLength,
              width_mm: hasWidth,
            }
          }
        })
        setParts(normalized)
        setHasNormalized(true)
      }
    }).catch(console.error)
  }, [initialParts, hasNormalized])
  
  // Step 3: Generation & Estimate
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null)
  
  // Save State
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [quoteNotes, setQuoteNotes] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreFileInputRef = useRef<HTMLInputElement>(null)

  // Process a list of files sequentially (avoids race conditions with concurrent uploads)
  const handleFiles = async (files: File[]) => {
    if (!files.length) return
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress({ current: 0, total: files.length, fileName: files[0].name })
    let addedCount = 0
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress({ current: i + 1, total: files.length, fileName: file.name })
      try {
        const res = await uploadFabFile(file)
        if (!res.detected) {
          errors.push(`${file.name}: ${res.reason || 'Failed to parse'}`)
          continue
        }
        let newParts: FabPartSpec[] = []
        if (res.parts && Array.isArray(res.parts)) {
          newParts = res.parts.map((p: any) => {
            // Material normalization first (needed for thickness lookup)
            const normalizeMap: Record<string, string> = {
              'crca': 'CRCA', 'cr sheet': 'CR Sheet', 'hr sheet': 'HR Sheet',
              'ms sheet': 'MS Sheet', 'gi sheet': 'GI Sheet',
              'cr': 'CR Sheet', 'hr': 'HR Sheet', 'ms': 'MS Sheet', 'gi': 'GI Sheet',
            }
            const rawMaterial = (p.material || '').trim()
            const normalizedMaterial = constants?.materials.find(
              m => m.toLowerCase() === rawMaterial.toLowerCase()
            ) || normalizeMap[rawMaterial.toLowerCase()] || rawMaterial

            // Smart thickness matching: find nearest thickness in constants for this material
            const detectedThickness = Number(p.thickness_mm) || 0
            const availableThicknesses: number[] = detectedThickness > 0 && normalizedMaterial && constants?.thicknesses[normalizedMaterial]
              ? constants.thicknesses[normalizedMaterial]
              : []
            const matchedThickness = detectedThickness > 0 && availableThicknesses.length > 0
              ? availableThicknesses.reduce((prev, curr) =>
                  Math.abs(curr - detectedThickness) < Math.abs(prev - detectedThickness) ? curr : prev
                )
              : detectedThickness

            const partName = (p.drg_no || p.description || '').trim() ||
              file.name.replace(/\.[^/.]+$/, '')

            const hasLength = Number(p.length_mm) > 0
            const hasWidth = Number(p.width_mm) > 0
            const hasMaterial = !!normalizedMaterial && !!(constants?.materials.includes(normalizedMaterial))
            const hasThickness = matchedThickness > 0

            return {
              name: partName,
              material: normalizedMaterial,
              thickness_mm: matchedThickness,
              length_mm: Number(p.length_mm) || 0,
              width_mm: Number(p.width_mm) || 0,
              qty: Number(p.qty) || 1,
              process: p.process || '',
              drg_no: p.drg_no || '',
              do_cut: true,
              do_bend: (p.process || '').toLowerCase().includes('bend'),
              do_punch: false,
              do_weld: (p.process || '').toLowerCase().includes('weld'),
              do_powder_dual: (p.process || '').toLowerCase().includes('powder') || (p.process || '').toLowerCase().includes('pc'),
              perim_mm: Number(p.perimeter_mm) || 0,
              geometry_svg: p.geometry_svg || '',
              int_cuts_mm: 0,
              bend_count: 0,
              bend_len_mm: 0,
              punch_count: 0,
              punch_dia_mm: 0,
              weld_len_mm: 0,
              weld_spots: 0,
              rfq_file_id: p.rfq_file_id,
              autoDetected: {
                material: hasMaterial,
                thickness_mm: hasThickness,
                length_mm: hasLength,
                width_mm: hasWidth,
              }
            }
          })
        }
        if (newParts.length > 0) {
          setParts(prev => [...prev, ...newParts])
          addedCount++
        }
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || 'Upload failed'}`)
      }
    }

    setIsUploading(false)
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (addMoreFileInputRef.current) addMoreFileInputRef.current.value = ''

    if (errors.length > 0) setUploadError(errors.join(' | '))
    if (addedCount > 0) setStep(2)
    else if (!errors.length && parts.length === 0) setUploadError('No valid parts found in any file')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }


  const updatePart = (index: number, field: keyof FabPartSpec, value: any) => {
    setParts(prev => {
      const newParts = [...prev]
      newParts[index] = { ...newParts[index], [field]: value }
      return newParts
    })
  }

  const toggleOp = (index: number, op: 'do_cut' | 'do_bend' | 'do_weld' | 'do_powder_dual') => {
    const newParts = [...parts]
    newParts[index] = { ...newParts[index], [op]: !newParts[index][op] }
    setParts(newParts)
  }

  const deletePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index))
    if (parts.length === 1) setStep(1)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerateError(null)
    setSaveSuccess(null)
    setSaveError(null)
    try {
      const estimateItems: EstimateRequestItem[] = parts.map(p => ({
        part_name: p.name,
        material: p.material,
        thickness: p.thickness_mm,
        quantity: p.qty,
        weight: Number(calcWeight(p)),
        perim_mm: p.perim_mm,
        bend_count: p.bend_count,
        welding_time: 0,
        machining_time: 0,
        labour_time: 0,
        rfq_file_id: p.rfq_file_id,
        geometry_svg: p.geometry_svg || '',
      }))
      const res = await generateEstimate(estimateItems)
      setEstimate(res)
      setStep(3)
    } catch (err: any) {
      setGenerateError(err.message || 'Estimate generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!rfqId || !customerId || !estimate) {
      setSaveError('Missing RFQ ID, Customer ID, or Estimate Data')
      return
    }
    setIsSaving(true)
    setSaveSuccess(null)
    setSaveError(null)
    try {
      const res = await createDraftQuote(rfqId, customerId, estimate, quoteNotes)
      setSaveSuccess(`Successfully saved Draft Quote: ${res.quote_number}`)
    } catch (err: any) {
      setSaveError(err.message || 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }
  
  const calcWeight = (p: FabPartSpec) => {
    return ((p.length_mm / 1000) * (p.width_mm / 1000) * (p.thickness_mm / 1000) * 7850 * p.qty).toFixed(2)
  }

  const isValid = (p: FabPartSpec) => {
    return p.name && p.material && p.thickness_mm > 0 && p.length_mm > 0 && p.width_mm > 0 && p.qty > 0
  }
  const allValid = parts.length > 0 && parts.every(isValid)

  const inputCls = "w-full h-8 px-2 bg-bg-elevated border border-border-default rounded text-[12px] text-text-primary focus:border-accent-primary focus:outline-none transition-colors"

  const getPartInputCls = (p: FabPartSpec, field: keyof NonNullable<FabPartSpec['autoDetected']>) => {
    const base = "w-full h-8 px-2 rounded text-[12px] text-text-primary focus:outline-none transition-colors border"
    if (!p.autoDetected) return `${base} border-border-default bg-bg-elevated focus:border-accent-primary`
    
    if (p.autoDetected[field]) {
      // GREEN - auto-detected
      return `${base} border-green-500/50 bg-green-500/10 focus:border-green-500`
    } else {
      // RED - missing
      return `${base} border-red-500/50 bg-red-500/10 focus:border-red-500`
    }
  }

  return (
    <div className="min-h-screen bg-bg-base pb-20">
      {/* Header (Only shown if no context banner) */}
      {!contextBanner && (
        <div className="border-b border-border-hairline bg-bg-surface/50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-steel mb-1">
              Bulk Processing
            </p>
            <h1 className="font-sans text-[24px] font-bold tracking-[-0.025em] text-text-primary">
              FAB Sheet
            </h1>
            <p className="font-sans text-[13px] text-text-secondary mt-1">
              Upload multiple files, review detected parameters, and generate batch quotes.
            </p>
          </div>
        </div>
      )}

      {contextBanner}

      {/* Steps Indicator */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4">
          {[
            { num: 1, label: 'Upload Files', active: step >= 1 },
            { num: 2, label: 'Review & Edit', active: step >= 2 },
            { num: 3, label: 'Summary & Save', active: step >= 3 }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${s.active ? 'text-accent-primary' : 'text-text-muted opacity-50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] border ${s.active ? 'border-accent-primary bg-accent-primary/10' : 'border-text-muted'}`}>
                  {s.num}
                </div>
                <span className="font-sans text-[13px] font-medium">{s.label}</span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-text-muted opacity-30" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6">
        
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto mt-10">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors
                ${isUploading ? 'border-accent-primary bg-accent-primary/5' : 'border-border-default hover:border-accent-steel bg-bg-surface'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                  <div className="text-center">
                    <p className="font-sans text-[15px] font-medium text-text-primary">
                      {uploadProgress ? `Parsing ${uploadProgress.current} / ${uploadProgress.total}` : 'Parsing files...'}
                    </p>
                    {uploadProgress && (
                      <p className="font-mono text-[12px] text-text-muted mt-1 truncate max-w-xs">
                        {uploadProgress.fileName}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center">
                    <FileUp className="w-8 h-8 text-accent-steel" />
                  </div>
                  <div>
                    <p className="font-sans text-[16px] font-medium text-text-primary">
                      Drag & drop your files here
                    </p>
                    <p className="font-sans text-[13px] text-text-secondary mt-1">
                      Supports .DXF, .PDF, and .XLSX BOM files
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept=".dxf,.pdf,.xlsx,.xls,.step,.stp,.iges,.igs"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFiles(Array.from(e.target.files))
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white text-[13px] font-semibold rounded-sharp transition-colors"
                  >
                    Browse Files
                  </button>
                  {parts.length > 0 && (
                    <button
                      onClick={() => setStep(2)}
                      className="mt-2 px-6 py-2.5 bg-transparent hover:bg-bg-elevated text-text-primary text-[13px] font-semibold rounded-sharp border border-border-default transition-colors"
                    >
                      Continue with existing parts ({parts.length})
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {uploadError && (
              <div className="mt-4 p-4 bg-accent-error/10 border border-accent-error/30 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-error flex-shrink-0" />
                <p className="font-sans text-[13px] text-accent-error">{uploadError}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Interactive Grid */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Batch Controls */}
            <div className="bg-bg-surface border border-border-hairline rounded p-5 flex flex-wrap gap-6 items-end">
              <div className="ml-auto flex gap-3 items-center">
                {/* Batch fill: copy first non-empty material to all empty rows */}
                {parts.some(p => !p.material) && parts.some(p => p.material) && (
                  <button
                    onClick={() => {
                      const firstMat = parts.find(p => p.material)?.material || ''
                      if (firstMat) setParts(parts.map(p => ({ ...p, material: p.material || firstMat })))
                    }}
                    className="px-3 h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[12px] font-mono rounded-sharp transition-colors"
                    title="Fill empty material fields with the first detected material"
                  >
                    Fill Material ↓
                  </button>
                )}
                {/* Batch fill thickness — auto-pick first available for each material */}
                {parts.some(p => p.material && !(p.thickness_mm > 0)) && (
                  <button
                    onClick={() => {
                      if (!constants) return
                      setParts(parts.map(p => {
                        if (p.thickness_mm > 0) return p
                        const available = constants.thicknesses[p.material] || []
                        if (!available.length) return p
                        // pick closest to 2mm as sensible default, or first
                        const best = available.reduce((prev, curr) =>
                          Math.abs(curr - 2) < Math.abs(prev - 2) ? curr : prev
                        )
                        return {
                          ...p,
                          thickness_mm: best,
                          autoDetected: { ...p.autoDetected, thickness_mm: false } as any
                        }
                      }))
                    }}
                    className="px-3 h-9 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[12px] font-mono rounded-sharp transition-colors"
                    title="Auto-fill thickness for rows that have material but no thickness"
                  >
                    Fill T ↓
                  </button>
                )}
                {/* Hidden secondary file input for adding more files without leaving step 2 */}
                <input
                  type="file"
                  ref={addMoreFileInputRef}
                  className="hidden"
                  multiple
                  accept=".dxf,.pdf,.xlsx,.xls,.step,.stp,.iges,.igs"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFiles(Array.from(e.target.files))
                    }
                  }}
                />
                {isUploading && uploadProgress && (
                  <span className="font-mono text-[11px] text-text-muted">
                    Parsing {uploadProgress.current}/{uploadProgress.total}…
                  </span>
                )}
                <button
                  onClick={() => addMoreFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 h-9 bg-bg-elevated hover:bg-bg-surface border border-border-default text-text-primary text-[13px] rounded-sharp transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                  Add More Files
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!allValid || isGenerating || isUploading}
                  className="px-6 h-9 flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 text-white font-semibold text-[13px] rounded-sharp transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Generate Approx Amount
                </button>
              </div>
            </div>

            {generateError && (
              <div className="p-4 bg-accent-error/10 border border-accent-error/30 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-error flex-shrink-0" />
                <p className="font-sans text-[13px] text-accent-error">{generateError}</p>
              </div>
            )}

            {/* The Grid */}
            {parts.length === 0 ? (
              <div className="bg-bg-surface border border-border-hairline rounded overflow-hidden p-10 text-center flex flex-col items-center">
                <File className="w-10 h-10 text-text-muted mb-4 opacity-50" />
                <p className="font-sans text-[15px] font-medium text-text-secondary">No parts loaded</p>
                <p className="font-mono text-[12px] text-text-muted mt-1">Please add files to begin processing.</p>
                <button
                  onClick={() => addMoreFileInputRef.current?.click()}
                  className="mt-4 px-6 h-9 bg-bg-elevated hover:bg-bg-surface border border-border-default text-text-primary text-[13px] rounded-sharp transition-colors"
                >
                  Add Files
                </button>
              </div>
            ) : (
            <div className="bg-bg-surface border border-border-hairline rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-bg-elevated/50 border-b border-border-hairline">
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted">Part Name</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-32">Material</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-20">T (mm)</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-20">L (mm)</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-20">W (mm)</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-20">Qty</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-24">Est Wt (kg)</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-48">Process</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-48">Ops</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase text-text-muted w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p, i) => {
                      const valid = isValid(p)
                      return (
                        <tr key={i} className={`border-b border-border-hairline ${valid ? '' : 'bg-accent-error/5'}`}>
                          <td className="px-4 py-2">
                            <input type="text" className={inputCls} value={p.name} onChange={e => updatePart(i, 'name', e.target.value)} />
                          </td>
                          <td className="px-4 py-2">
                            <select 
                              className={getPartInputCls(p, 'material')} 
                              value={p.material} 
                              onChange={e => {
                                updatePart(i, 'material', e.target.value)
                                updatePart(i, 'thickness_mm', 0)
                              }}
                            >
                              <option value="">Select...</option>
                              {constants?.materials.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select 
                              className={getPartInputCls(p, 'thickness_mm')} 
                              value={p.thickness_mm || ''} 
                              onChange={e => updatePart(i, 'thickness_mm', Number(e.target.value))}
                              disabled={!p.material}
                            >
                              <option value="">...</option>
                              {(constants?.thicknesses[p.material] || []).map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" min={0} step={1} className={getPartInputCls(p, 'length_mm')} value={p.length_mm || ''} onChange={e => updatePart(i, 'length_mm', Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" min={0} step={1} className={getPartInputCls(p, 'width_mm')} value={p.width_mm || ''} onChange={e => updatePart(i, 'width_mm', Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" min={1} step={1} className={inputCls} value={p.qty || ''} onChange={e => updatePart(i, 'qty', Number(e.target.value))} />
                          </td>
                          <td className="px-4 py-2 font-mono text-[13px] text-accent-steel">
                            {calcWeight(p)}
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" className={inputCls} value={p.process} onChange={e => updatePart(i, 'process', e.target.value)} placeholder="e.g. Laser + Bend" />
                          </td>
                          <td className="px-4 py-2 flex gap-1 items-center h-[48px]">
                            <button onClick={() => toggleOp(i, 'do_cut')} className={`px-1.5 py-0.5 rounded font-mono text-[10px] border transition-colors ${p.do_cut ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-transparent border-border-default text-text-muted'}`}>CUT</button>
                            <button onClick={() => toggleOp(i, 'do_bend')} className={`px-1.5 py-0.5 rounded font-mono text-[10px] border transition-colors ${p.do_bend ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-transparent border-border-default text-text-muted'}`}>BEND</button>
                            <button onClick={() => toggleOp(i, 'do_weld')} className={`px-1.5 py-0.5 rounded font-mono text-[10px] border transition-colors ${p.do_weld ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-transparent border-border-default text-text-muted'}`}>WELD</button>
                            <button onClick={() => toggleOp(i, 'do_powder_dual')} className={`px-1.5 py-0.5 rounded font-mono text-[10px] border transition-colors ${p.do_powder_dual ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-transparent border-border-default text-text-muted'}`}>PC</button>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => deletePart(i)} className="p-1.5 text-text-muted hover:text-accent-error hover:bg-accent-error/10 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && estimate && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans text-[20px] font-bold text-text-primary">Approximate Estimate</h2>
                <p className="font-sans text-[13px] text-text-secondary mt-1">
                  Review your approximate costs before submitting your request.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={isSaving}
                  className="px-4 h-9 bg-bg-elevated hover:bg-bg-surface border border-border-default text-text-primary text-[13px] rounded-sharp transition-colors disabled:opacity-50"
                >
                  Back to Editor
                </button>
                <button
                  onClick={async () => {
                    try {
                      await exportApproxPdf(estimate)
                    } catch (err: any) {
                      setSaveError(err.message || 'PDF export failed')
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 h-9 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[13px] rounded-sharp transition-colors disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" /> Approx PDF
                </button>
                <button
                  onClick={async () => {
                    try {
                      await exportExcelBOM(estimate)
                    } catch (err: any) {
                      setSaveError(err.message || 'Excel export failed')
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 h-9 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-[13px] rounded-sharp transition-colors disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" /> Excel BOM
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !rfqId}
                  className="px-6 h-9 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-[13px] rounded-sharp transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Submit to Admin
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="font-sans text-[13px] text-emerald-500 font-medium">{saveSuccess}</p>
              </div>
            )}
            {saveError && (
              <div className="p-4 bg-accent-error/10 border border-accent-error/30 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-error flex-shrink-0" />
                <p className="font-sans text-[13px] text-accent-error">{saveError}</p>
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Summary Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-bg-surface border border-border-hairline rounded p-5 space-y-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-steel">
                    Financial Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border-hairline">
                      <span className="font-sans text-[13px] text-text-secondary">Estimated Total Items</span>
                      <span className="font-sans text-[14px] text-text-primary font-medium">{estimate.items.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-hairline">
                      <span className="font-sans text-[13px] text-text-secondary">Total Quantity</span>
                      <span className="font-sans text-[14px] text-text-primary">{estimate.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-bg-elevated px-3 rounded mt-2">
                      <span className="font-sans text-[13px] text-text-secondary uppercase tracking-wider font-semibold">Approximate Range</span>
                      <span className="font-mono text-[16px] text-accent-primary font-bold">
                        ₹{(estimate.grand_total * 0.95).toLocaleString('en-IN', {maximumFractionDigits: 0})} - ₹{(estimate.grand_total * 1.05).toLocaleString('en-IN', {maximumFractionDigits: 0})}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-surface border border-border-hairline rounded p-5 space-y-3">
                   <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-accent-steel mb-1">
                      Quote Notes
                    </label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 bg-bg-elevated border border-border-default rounded text-[13px] text-text-primary focus:border-accent-primary focus:outline-none transition-colors resize-y"
                      placeholder="e.g. Price valid for 15 days. Transport extra."
                      value={quoteNotes}
                      onChange={e => setQuoteNotes(e.target.value)}
                    />
                </div>
              </div>

              {/* Items List */}
              <div className="lg:col-span-2 bg-bg-surface border border-border-hairline rounded overflow-hidden">
                <div className="px-5 py-3 border-b border-border-hairline bg-bg-elevated/50 flex justify-between">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    Part Cost Breakdown
                  </h3>
                  <span className="font-mono text-[10px] text-text-muted">
                    {estimate.items.length} items
                  </span>
                </div>
                <div className="divide-y divide-border-hairline max-h-[600px] overflow-y-auto">
                  {estimate.items.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-bg-elevated/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-sans text-[14px] font-bold text-text-primary">{item.part_name}</h4>
                          </div>
                          <p className="font-mono text-[11px] text-text-muted mt-1">
                            {item.material} · {item.thickness}mm · Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[13px] font-medium text-text-secondary">
                            Est. Weight: {item.weight.toFixed(2)} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
