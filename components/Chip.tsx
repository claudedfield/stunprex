/**
 * Chip — canonical chip/tag component. Style System §5.3.
 *
 * Three render modes, selected automatically:
 *   href    → <a href> (navigation chip)
 *   onClick → <button type="button"> with aria-pressed (interactive filter chip)
 *   neither → <span> (display-only chip)
 *
 * Active variant:   bg-deepblue text-white
 * Inactive variant: outlined border border-deepblue/20 …
 */
import type { ReactNode } from 'react'

interface ChipProps {
  active?: boolean
  href?: string
  onClick?: () => void
  children: ReactNode
  className?: string
  'aria-pressed'?: boolean
  'aria-current'?: React.AriaAttributes['aria-current']
}

export function Chip({
  active = false,
  href,
  onClick,
  children,
  className = '',
  'aria-pressed': ariaPressed,
  'aria-current': ariaCurrent,
}: ChipProps) {
  const base =
    'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1'
  const variant = active
    ? 'bg-deepblue text-white'
    : 'border border-deepblue/20 bg-white text-brown/65 hover:text-deepblue hover:border-deepblue/40'
  const cls = `${base} ${variant} ${className}`.trim()

  if (href) {
    return (
      <a href={href} className={cls} aria-current={ariaCurrent}>
        {children}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={ariaPressed} className={cls}>
        {children}
      </button>
    )
  }
  return <span className={cls}>{children}</span>
}
