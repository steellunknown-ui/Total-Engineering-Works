'use client'

import { useState } from 'react'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { FadeIn } from '@/components/motion/FadeIn'
import { Button } from '@/components/ui/Button'
import { siteConfig } from '@/config/site'
import { MapPin, Mail, Phone, Clock, Send } from 'lucide-react'
import { Captcha } from '@/components/ui/Captcha'

const CONTACT_INFO = [
  {
    title: 'Manufacturing Facility',
    address: siteConfig.address.facility,
    icon: MapPin,
  },
  {
    title: 'Corporate Office',
    address: siteConfig.address.corporate,
    icon: MapPin,
  },
  {
    title: 'Email Us',
    address: siteConfig.contact.email,
    sub: 'General Enquiries & Support',
    icon: Mail,
    href: `mailto:${siteConfig.contact.email}`,
  },
  {
    title: 'Call Us',
    address: siteConfig.contact.phone,
    sub: 'Mon - Sat, 9am - 6pm IST',
    icon: Phone,
    href: `tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`,
  },
]

export function ContactFormSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaChecked, setCaptchaChecked] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!captchaChecked) {
      alert('Please confirm that you are not a robot.')
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    alert('Thank you! Your inquiry has been received. Our team will contact you shortly.')
  }

  return (
    <SectionContainer background="base" spacing="default" className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Left Side: Contact Information */}
        <FadeIn className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            {CONTACT_INFO.map((item, idx) => (
              <div key={item.title} className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-bg-surface border border-border-hairline flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all duration-300">
                  <item.icon size={22} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sans font-bold text-[18px] text-text-primary tracking-tight">
                    {item.title}
                  </h3>
                  {item.href ? (
                    <a href={item.href} className="font-sans text-body text-text-secondary hover:text-accent-primary transition-colors">
                      {item.address}
                    </a>
                  ) : (
                    <p className="font-sans text-body text-text-secondary leading-relaxed">
                      {item.address}
                    </p>
                  )}
                  {item.sub && (
                    <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">
                      {item.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="p-8 bg-bg-surface border border-border-hairline rounded-2xl">
            <div className="flex items-center gap-3 text-accent-primary mb-4">
              <Clock size={20} />
              <span className="font-sans font-bold text-[16px]">Fast Response Guaranteed</span>
            </div>
            <p className="font-sans text-[15px] text-text-secondary leading-relaxed">
              We understand the urgency of industrial procurement. Our strategic 
              projects team reviews all inquiries within 24 hours to provide 
              initial technical feedback or a formal quotation.
            </p>
          </div>
        </FadeIn>

        {/* Right Side: Inquiry Form */}
        <FadeIn delay={0.2}>
          <div className="relative p-8 md:p-10 bg-bg-surface border border-border-hairline rounded-[32px] shadow-2xl overflow-hidden group">
            {/* Subtle Gradient Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-col gap-2 mb-2">
                <h2 className="font-sans font-bold text-[24px] md:text-[32px] text-text-primary tracking-tight">
                  Send Us an Inquiry
                </h2>
                <p className="font-sans text-text-secondary">
                  Complete the form below and our team will get back to you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Full Name *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Your full name"
                    className="w-full bg-bg-void border border-border-hairline rounded-lg px-4 py-3 text-text-primary focus:border-accent-primary outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Company *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Your company name"
                    className="w-full bg-bg-void border border-border-hairline rounded-lg px-4 py-3 text-text-primary focus:border-accent-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Email *</label>
                  <input 
                    required
                    type="email" 
                    placeholder="your.email@company.com"
                    className="w-full bg-bg-void border border-border-hairline rounded-lg px-4 py-3 text-text-primary focus:border-accent-primary outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Phone *</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full bg-bg-void border border-border-hairline rounded-lg px-4 py-3 text-text-primary focus:border-accent-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Message *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Tell us about your manufacturing requirements..."
                  className="w-full bg-bg-void border border-border-hairline rounded-lg px-4 py-3 text-text-primary focus:border-accent-primary outline-none transition-colors resize-none"
                />
              </div>

              {/* Captcha */}
              <div className="mt-2">
                <Captcha checked={captchaChecked} onChange={setCaptchaChecked} />
              </div>

              <Button 
                type="submit"
                variant="primary" 
                className="w-full py-4 h-auto text-[16px] font-bold"
                disabled={isSubmitting || !captchaChecked}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit Inquiry <Send size={16} />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </FadeIn>

      </div>
    </SectionContainer>
  )
}
