'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UploadCloud, CheckCircle2 } from 'lucide-react'
import { useRFQModal, ModalMode } from '@/context/RFQModalContext'
import { Button } from '@/components/ui/Button'
import { Captcha } from '@/components/ui/Captcha'
import { cn } from '@/utils/cn'

/* ── Form Data State ─────────────────────────────────────────────────────── */
// Keeping state purely UI-focused for now as per plan
export function RFQModal() {
  const { isOpen, mode, openModal, closeModal } = useRFQModal()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [captchaChecked, setCaptchaChecked] = useState(false)

  // Reset states when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSuccess(false)
        setCaptchaChecked(false)
      }, 300)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeModal()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeModal])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!captchaChecked) {
      alert('Please confirm that you are not a robot.')
      return
    }

    setIsSubmitting(true)
    // Simulate network delay
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop (Glassmorphism) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeModal}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* ── Modal Container ── */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="
                pointer-events-auto
                relative w-full max-w-4xl max-h-[90vh] flex flex-col
                bg-bg-elevated/80 backdrop-blur-2xl
                border border-border-default shadow-[0_16px_64px_rgba(0,0,0,0.5)]
                rounded-sharp overflow-hidden
              "
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* ── Header & Tabs ── */}
              <div className="flex-shrink-0 border-b border-border-hairline bg-bg-surface/50">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h2 id="modal-title" className="font-sans text-[20px] font-semibold text-text-primary tracking-[-0.02em]">
                    Start a Conversation
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1 text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Mode Tabs */}
                {!isSuccess && (
                  <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
                    {(['rfq', 'enquiry', 'visit'] as const).map((tabMode) => (
                      <button
                        key={tabMode}
                        onClick={() => openModal(tabMode)}
                        className={cn(
                          'pb-3 font-sans text-[14px] font-medium transition-colors relative',
                          mode === tabMode
                            ? 'text-text-primary'
                            : 'text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {tabMode === 'rfq' ? 'Request For Quotation' : tabMode === 'enquiry' ? 'General Enquiry' : 'Book a Facility Visit'}
                        {mode === tabMode && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Body (Scrollable) ── */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6" data-lenis-prevent="true">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-6"
                    >
                      <CheckCircle2 size={32} />
                    </motion.div>
                    <h3 className="font-sans text-[24px] font-semibold text-text-primary tracking-[-0.02em] mb-2">
                      Request Received
                    </h3>
                    <p className="font-sans text-text-secondary max-w-md mx-auto leading-[1.6]">
                      Thank you for reaching out. Our engineering team will review your submission and respond within 24 hours.
                    </p>
                    <Button onClick={closeModal} variant="secondary" className="mt-8">
                      Close Window
                    </Button>
                  </div>
                ) : (
                  <form id="rfq-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
                    
                    {/* Basic Info (Common to both modes) */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-steel border-b border-border-hairline pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Full Name *" id="name" required />
                        <InputGroup label="Company Name" id="company" />
                        <InputGroup label="Email Address *" id="email" type="email" required />
                        <InputGroup label="Phone Number" id="phone" type="tel" />
                      </div>
                    </div>

                    {mode === 'rfq' ? (
                      /* ── RFQ Specific Fields ── */
                      <>
                        <div className="flex flex-col gap-4">
                          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-steel border-b border-border-hairline pb-2">
                            Project Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectGroup 
                              label="Service Required *" 
                              id="service" 
                              required
                              options={[
                                'Sheet Metal Fabrication',
                                'CNC Machining',
                                'Welding',
                                'Surface Treatment',
                                'Electrical Panels',
                                'Design & Development',
                                'Defense Products',
                                'Other'
                              ]} 
                            />
                            <InputGroup label="Material Required" id="material" placeholder="e.g. Al 6061-T6, SS 304" />
                            <InputGroup label="Estimated Quantity" id="quantity" type="number" />
                            <InputGroup label="Required Delivery Timeline" id="timeline" placeholder="e.g. 4 Weeks" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-steel border-b border-border-hairline pb-2">
                            Technical Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectGroup label="Industry Sector" id="industry" options={['Defense & Aerospace', 'Telecommunications', 'Energy & Power', 'Healthcare & Medical', 'Industrial Automation', 'Other']} />
                            <InputGroup label="Tolerance Requirements" id="tolerance" placeholder="e.g. ±0.01mm" />
                            <div className="md:col-span-2">
                              <label htmlFor="description" className="block font-sans text-[13px] text-text-secondary mb-1.5">Project Description *</label>
                              <textarea
                                id="description"
                                required
                                rows={3}
                                className="w-full bg-bg-base/50 border border-border-default rounded-sm px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-y"
                                placeholder="Briefly describe the application and any critical requirements..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* File Upload Dropzone */}
                        <div className="flex flex-col gap-4">
                          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-steel border-b border-border-hairline pb-2">
                            Engineering Files
                          </h3>
                          <div className="
                            border-2 border-dashed border-border-active bg-bg-base/30 hover:bg-bg-base/50 
                            transition-colors duration-200 rounded-sm
                            flex flex-col items-center justify-center p-8 text-center cursor-pointer group
                          ">
                            <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors mb-3">
                              <UploadCloud size={24} />
                            </div>
                            <p className="font-sans text-[14px] font-medium text-text-primary mb-1">
                              Drag & Drop CAD Files or Drawings
                            </p>
                            <p className="font-mono text-[11px] text-text-muted tracking-[0.02em]">
                              Supported formats: .STEP, .IGES, .DWG, .PDF, .ZIP (Max 50MB)
                            </p>
                          </div>
                        </div>
                      </>
                    ) : mode === 'enquiry' ? (
                      /* ── General Enquiry Specific Fields ── */
                      <div className="flex flex-col gap-4">
                        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-steel border-b border-border-hairline pb-2">
                          Message Details
                        </h3>
                        <div className="flex flex-col gap-4">
                          <SelectGroup 
                            label="Purpose of Enquiry *" 
                            id="purpose" 
                            required
                            options={[
                              'Sales & New Business', 
                              'Vendor / Supplier Registration', 
                              'Partnerships & Media', 
                              'Careers / HR', 
                              'Other'
                            ]} 
                          />
                          <InputGroup label="Subject Line *" id="subject" required />
                          <div>
                            <label htmlFor="message" className="block font-sans text-[13px] text-text-secondary mb-1.5">Message Body *</label>
                            <textarea
                              id="message"
                              required
                              rows={5}
                              className="w-full bg-bg-base/50 border border-border-default rounded-sm px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-y"
                              placeholder="How can we help you today?"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Book a Visit Specific Fields ── */
                      <div className="flex flex-col gap-4">
                        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-steel border-b border-border-hairline pb-2">
                          Visit Scheduling
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputGroup label="Preferred Date *" id="visit-date" type="date" required />
                          <SelectGroup 
                            label="Preferred Time Slot *" 
                            id="visit-time" 
                            required
                            options={['Morning (10:00 - 12:00)', 'Afternoon (14:00 - 16:00)', 'Evening (16:00 - 18:00)']} 
                          />
                          <InputGroup label="Number of Visitors *" id="visitors" type="number" required defaultValue="1" />
                          <SelectGroup 
                            label="Purpose of Visit *" 
                            id="visit-purpose" 
                            required
                            options={[
                              'Process Audit',
                              'Vendor Assessment',
                              'Project Kick-off',
                              'Technical Discussion',
                              'Strategic Partnership',
                              'Other'
                            ]} 
                          />
                        </div>
                        <div className="mt-2">
                          <label htmlFor="visit-notes" className="block font-sans text-[13px] text-text-secondary mb-1.5">Additional Requirements / Notes</label>
                          <textarea
                            id="visit-notes"
                            rows={3}
                            className="w-full bg-bg-base/50 border border-border-default rounded-sm px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-y"
                            placeholder="Please mention any specific departments or machines you'd like to inspect..."
                          />
                        </div>
                      </div>
                    )}

                    {/* ── Captcha ── */}
                    <div className="mt-2">
                      <Captcha checked={captchaChecked} onChange={setCaptchaChecked} />
                    </div>
                  </form>
                )}
              </div>

              {/* ── Footer / Actions ── */}
              {!isSuccess && (
                <div className="flex-shrink-0 border-t border-border-hairline bg-bg-surface/50 px-6 py-4 flex items-center justify-between">
                  <p className="hidden sm:block font-mono text-[10px] text-text-muted tracking-[0.04em]">
                    NDA available upon request. Data is securely transmitted.
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button type="button" onClick={closeModal} variant="secondary" className="flex-1 sm:flex-none justify-center">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      form="rfq-form" 
                      variant="primary" 
                      className="flex-1 sm:flex-none justify-center"
                      disabled={isSubmitting || !captchaChecked}
                    >
                      {isSubmitting ? 'Submitting...' : mode === 'rfq' ? 'Submit RFQ' : mode === 'enquiry' ? 'Send Message' : 'Confirm Visit Request'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ── Helper Components ── */
function InputGroup({ label, id, type = 'text', required = false, placeholder, defaultValue }: any) {
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-[13px] text-text-secondary mb-1.5">
        {label}
      </label>
      <input
        type={type}
        id={id}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full bg-bg-base/50 border border-border-default rounded-sm px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
      />
    </div>
  )
}

function SelectGroup({ label, id, options, required = false }: any) {
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-[13px] text-text-secondary mb-1.5">
        {label}
      </label>
      <select
        id={id}
        required={required}
        defaultValue=""
        className="w-full bg-bg-base/50 border border-border-default rounded-sm px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-accent-primary transition-colors appearance-none"
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238A8A8E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
      >
        <option value="" disabled hidden>Select an option</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt} className="bg-bg-elevated text-text-primary">{opt}</option>
        ))}
      </select>
    </div>
  )
}
