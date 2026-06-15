import Link from 'next/link'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize    = 'default' | 'sm' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

// Button as a <button> element
interface ButtonAsButton extends ButtonBaseProps {
  as?: 'button'
  type?: 'button' | 'submit' | 'reset'
  form?: string
  onClick?: () => void
  href?: never
}

// Button as a Next.js <Link>
interface ButtonAsLink extends ButtonBaseProps {
  as: 'link'
  href: string
  external?: boolean
  download?: boolean
  type?: never
  onClick?: () => void
}

type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * Midnight Engineering button variants:
 *
 * primary  — iOS blue fill (#0A84FF). White text. Subtle lift on hover.
 * secondary — transparent + ghost border (rgba white 12%). Hover: blue border + blue text.
 * ghost    — no border, no bg. Accent-steel text + arrow. Hover: text-primary.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-primary text-white',
    'hover:bg-accent-primary-hover',
    'hover:-translate-y-px',
    'active:translate-y-0',
    'border border-transparent',
    // Shadow uses CSS var so it matches whatever accent is active
    '[box-shadow:0_0_0_0_rgba(var(--accent-primary-rgb),0)] hover:[box-shadow:0_0_20px_rgba(var(--accent-primary-rgb),0.28)]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'transition-all duration-200',
  ].join(' '),

  secondary: [
    'bg-transparent text-text-primary',
    'border border-border-default',
    'hover:border-accent-primary hover:text-accent-primary',
    'hover:bg-accent-primary/[0.06]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'transition-all duration-200',
  ].join(' '),

  ghost: [
    'bg-transparent text-accent-steel',
    'border-0 px-0',
    'hover:text-text-primary',
    'group',
    'disabled:opacity-40 disabled:pointer-events-none',
    'transition-colors duration-200',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  lg:      'px-10 py-4 text-[16px]',
  default: 'px-7 py-3.5 text-[15px]',
  sm:      'px-5 py-2.5 text-[13px]',
}

/**
 * Button — the single button component for the entire site.
 * Midnight Engineering: iOS blue primary, ghost-border secondary.
 *
 * Supports:
 * - variant: primary | secondary | ghost
 * - size: lg | default | sm
 * - as: 'button' (default) | 'link' (renders Next.js Link)
 * - loading: shows spinner + disables interaction
 */
export function Button(props: ButtonProps) {
  const {
    variant  = 'primary',
    size     = 'default',
    loading  = false,
    disabled = false,
    className,
    children,
  } = props

  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'font-sans font-semibold',
    'rounded-cta',
    'leading-none select-none whitespace-nowrap',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
    variant !== 'ghost' ? sizeClasses[size] : '',
    variantClasses[variant],
  ].join(' ')

  const isDisabled = disabled || loading

  const content = (
    <>
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
      {variant === 'ghost' && (
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      )}
    </>
  )

  if (props.as === 'link') {
    const { href, external, download } = props
    return (
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        download={download}
        className={cn(baseClasses, className)}
        onClick={props.onClick}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type={props.type ?? 'button'}
      form={(props as any).form}
      onClick={props.onClick}
      disabled={isDisabled}
      className={cn(baseClasses, className)}
    >
      {content}
    </button>
  )
}
