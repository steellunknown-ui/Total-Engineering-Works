'use client'

import { cn } from '@/utils/cn'

interface CaptchaProps {
  checked: boolean
  onChange: (val: boolean) => void
}

export function Captcha({ checked, onChange }: CaptchaProps) {
  return (
    <div 
      className="inline-flex items-center gap-4 px-4 py-3 bg-bg-surface/50 border border-border-hairline backdrop-blur-sm rounded-sm cursor-pointer select-none"
      onClick={() => onChange(!checked)}
    >
      <div className={cn(
        "w-5 h-5 border transition-all flex items-center justify-center",
        checked ? "bg-accent-primary border-accent-primary" : "border-white/30 bg-black/20"
      )}>
        {checked && <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white -rotate-45 mb-1" />}
      </div>
      <p className="font-sans text-[13px] text-text-primary tracking-tight">I'm not a robot</p>
      <div className="ml-8 flex flex-col items-center gap-0.5 opacity-40">
        <div className="w-6 h-6 border-2 border-accent-primary rounded-full relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-accent-primary/20" />
        </div>
        <p className="text-[7px] font-mono uppercase tracking-tighter">reCAPTCHA</p>
      </div>
    </div>
  )
}
