'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react'

export default function RequestQuotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [rfqNumber, setRfqNumber] = useState('')
  const [error, setError] = useState('')
  
  // Form State
  const [companyName, setCompanyName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  
  const [material, setMaterial] = useState('MS Sheet')
  const [thickness, setThickness] = useState<number | ''>(2)
  const [quantity, setQuantity] = useState<number | ''>(10)

  const [estimateSummary, setEstimateSummary] = useState<{min: number, max: number, ratio: number} | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadEstimate = async (format: 'pdf' | 'excel') => {
    if (!rfqNumber) return
    
    try {
      const endpoint = format === 'excel' ? `/api/public/estimate/${rfqNumber}/xlsx` : `/api/public/estimate/${rfqNumber}/pdf`
      window.open(`http://localhost:8000${endpoint}`, '_blank')
    } catch (e) {
      console.error(e)
    }
  }


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (files.length === 0) {
      setError('Please upload at least one CAD or PDF file.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('company_name', companyName)
      formData.append('contact_person', contactPerson)
      formData.append('email', email)
      if (phone) formData.append('phone', phone)
      if (projectDescription) formData.append('project_description', projectDescription)
      
      formData.append('material', material)
      formData.append('thickness', thickness.toString())
      formData.append('quantity', quantity.toString())
      
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('http://localhost:8000/api/public/rfq', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit request')
      }

      setRfqNumber(data.rfq_number)
      if (data.estimate_min && data.estimate_max) {
        setEstimateSummary({ min: data.estimate_min, max: data.estimate_max, ratio: data.material_ratio || 0.6 })
      }
      setIsSuccess(true)
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-xl w-full space-y-8 bg-bg-elevated p-10 rounded-xl border border-divider shadow-2xl text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-accent-primary" />
          <h2 className="mt-6 text-3xl font-bold text-white tracking-tight">
            Your Instant Estimate
          </h2>
          <div className="mt-4 text-text-secondary space-y-6">
            <p>Your RFQ <span className="font-mono text-accent-primary">{rfqNumber}</span> has been securely submitted to our engineering team.</p>
            
            {estimateSummary ? (
              <div className="bg-bg-base p-6 rounded-xl border border-accent-primary/40 text-left">
                {(() => {
                  const r = estimateSummary.ratio;
                  const matMin = Math.floor(estimateSummary.min * r / 10000) * 10000;
                  const matMax = Math.ceil(estimateSummary.max * r / 10000) * 10000;
                  const fabMin = Math.floor(estimateSummary.min * (1-r) / 10000) * 10000;
                  const fabMax = Math.ceil(estimateSummary.max * (1-r) / 10000) * 10000;
                  const totalMin = matMin + fabMin;
                  const totalMax = matMax + fabMax;

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-text-secondary border-b border-divider pb-3 text-sm">
                        <span>Estimated Material Cost</span>
                        <span className="font-mono text-white tracking-wider">₹{matMin.toLocaleString('en-IN')} - ₹{matMax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-text-secondary border-b border-divider pb-3 text-sm">
                        <span>Estimated Processing Cost</span>
                        <span className="font-mono text-white tracking-wider">₹{fabMin.toLocaleString('en-IN')} - ₹{fabMax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-accent-primary font-bold text-lg">Total Estimate (Excl. GST)</span>
                        <span className="text-2xl font-mono font-bold text-accent-primary tracking-tight">
                          ₹{totalMin.toLocaleString('en-IN')} - ₹{totalMax.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[11px] text-text-muted mt-6 text-center leading-relaxed">
                  *Our engineering team is reviewing your files for DFM. You will receive an exact quotation in your inbox shortly.
                </p>
                
                <div className="flex gap-4 justify-center mt-6">
                  <button onClick={() => downloadEstimate('pdf')} className="py-2 px-6 border border-divider rounded bg-bg-elevated text-sm hover:border-accent-primary transition-colors text-white">
                    Download PDF
                  </button>
                  <button onClick={() => downloadEstimate('excel')} className="py-2 px-6 border border-divider rounded bg-bg-elevated text-sm hover:border-accent-primary transition-colors text-white">
                    Download Excel
                  </button>
                </div>
              </div>
            ) : (
               <div className="bg-bg-base p-6 rounded-xl border border-divider text-center">
                 <p className="text-text-muted">Files successfully submitted. Estimate requires manual review.</p>
               </div>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex justify-center py-3 px-4 border border-divider rounded-md shadow-sm text-sm font-medium text-white bg-bg-base hover:bg-bg-elevated transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight sm:text-5xl">
            Request a Quote
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Upload your DXF, DWG, STEP, or PDF files. Our procurement and engineering team will evaluate your requirements and provide a detailed quotation.
          </p>
        </div>

        <div className="bg-bg-elevated rounded-xl shadow-2xl border border-divider overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-white border-b border-divider pb-2 mb-6">
                Company Details
              </h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                
                <div className="sm:col-span-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary">
                    Company Name <span className="text-accent-primary">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="companyName"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors sm:text-sm"
                      placeholder="Total Engineering Works"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-text-secondary">
                    Contact Person <span className="text-accent-primary">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="contactPerson"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors sm:text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                    Email Address <span className="text-accent-primary">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors sm:text-sm"
                      placeholder="procurement@company.com"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors sm:text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Project Details */}
            <div>
              <h3 className="text-lg font-medium text-white border-b border-divider pb-2 mb-6 mt-10">
                Estimation Parameters
              </h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3 mb-8">
                <div>
                  <label htmlFor="material" className="block text-sm font-medium text-text-secondary">
                    Material <span className="text-accent-primary">*</span>
                  </label>
                  <select
                    id="material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-3 bg-bg-base border border-divider rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
                  >
                    <option value="MS Sheet">MS Sheet</option>
                    <option value="HR Sheet">HR Sheet</option>
                    <option value="CR Sheet">CR Sheet</option>
                    <option value="SS304 Sheet">SS304 Sheet</option>
                    <option value="SS316 Sheet">SS316 Sheet</option>
                    <option value="Aluminium Sheet">Aluminium Sheet</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="thickness" className="block text-sm font-medium text-text-secondary">
                    Thickness (mm) <span className="text-accent-primary">*</span>
                  </label>
                  <input
                    type="number"
                    id="thickness"
                    min="0.1"
                    step="0.1"
                    required
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary">
                    Quantity <span className="text-accent-primary">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-text-secondary">
                    Project Requirements / Notes
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="projectDescription"
                      rows={4}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-bg-base border border-divider rounded-md text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors sm:text-sm resize-none"
                      placeholder="Please specify material, quantities, and required finish..."
                    />
                  </div>
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Engineering Files (CAD / PDF) <span className="text-accent-primary">*</span>
                  </label>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-divider border-dashed rounded-md bg-bg-base hover:border-accent-primary/50 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-2 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-text-muted group-hover:text-accent-primary transition-colors" />
                      <div className="flex text-sm text-text-secondary justify-center">
                        <span className="relative cursor-pointer rounded-md font-medium text-accent-primary hover:text-accent-primary-hover focus-within:outline-none">
                          <span>Upload files</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            multiple 
                            className="sr-only" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-text-muted">
                        DXF, DWG, STEP, PDF up to 50MB
                      </p>
                    </div>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {files.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between py-2 px-3 bg-bg-base border border-divider rounded-md">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <FileIcon size={16} className="text-accent-steel flex-shrink-0" />
                            <span className="text-sm text-text-secondary truncate w-full">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="text-text-muted hover:text-red-400 transition-colors ml-4 flex-shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-divider flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-accent-primary hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Processing...' : 'Get Instant Estimate'}
              </button>
            </div>
            
          </form>
        </div>
      </div>

      {/* Professional Processing Popup Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-elevated p-8 rounded-2xl shadow-2xl border border-divider text-center max-w-sm w-full mx-4 flex flex-col items-center">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Processing Request</h3>
            <p className="text-sm text-text-secondary">
              Please wait while we securely upload your files and generate your RFQ...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
