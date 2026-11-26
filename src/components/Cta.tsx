import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react'
import './cta.css'

type Common = {
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'sm'
  /** full-width (mobile panels, stacked layouts) */
  block?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
}
type AnchorProps = Common & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string }
type ButtonProps = Common & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined }
export type CtaProps = AnchorProps | ButtonProps

/* Visible rings that are in view share one IntersectionObserver; rings
   off-screen are paused (animation-play-state) so idle CTAs cost nothing. */
let io: IntersectionObserver | null = null
function observe(el: Element) {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  io ??= new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.target as HTMLElement).toggleAttribute('data-live', e.isIntersecting)),
    { rootMargin: '120px' },
  )
  io.observe(el)
  return () => io?.unobserve(el)
}

/**
 * Global CTA. A pill with a solid inner surface and a 1px illuminated border;
 * two short beams travel the border's true rounded perimeter (the rect is
 * re-measured on resize, so the light never skips a corner or seams).
 *   idle   — slow travel, quiet glow
 *   hover  — beams brighten and lengthen, halo opens, surface lifts
 *   press  — surface compresses, beams flare
 *   focus  — keyboard ring outside the pill
 * Loading/disabled keep the label and destination; the beam stops.
 */
const Cta = forwardRef<HTMLElement, CtaProps>(function Cta(props, ref) {
  const { variant = 'primary', size = 'md', block, loading, className = '', children, ...rest } = props
  const el = useRef<HTMLElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const gid = useId().replace(/:/g, '')
  useImperativeHandle(ref, () => el.current as HTMLElement)

  useEffect(() => {
    const host = el.current
    const s = svg.current
    if (!host || !s) return
    const rects = s.querySelectorAll('rect')
    const fit = () => {
      const w = host.offsetWidth
      const h = host.offsetHeight
      if (!w || !h) return
      const iw = w - 1
      const ih = h - 1
      const r = ih / 2
      rects.forEach((rc) => {
        rc.setAttribute('x', '0.5')
        rc.setAttribute('y', '0.5')
        rc.setAttribute('width', String(iw))
        rc.setAttribute('height', String(ih))
        rc.setAttribute('rx', String(r))
        rc.setAttribute('ry', String(r))
      })
      s.setAttribute('viewBox', `0 0 ${w} ${h}`)
      // exact perimeter of a stadium: two straights + one full circle
      const p = 2 * Math.max(0, iw - ih) + Math.PI * ih
      host.style.setProperty('--p', p.toFixed(2))
    }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(host)
    const un = observe(host)
    return () => {
      ro?.disconnect()
      un()
    }
  }, [])

  const cls = [
    'cta',
    `cta--${variant}`,
    size === 'sm' && 'cta--sm',
    block && 'cta--block',
    loading && 'is-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      <span className="cta__surface" aria-hidden="true" />
      <svg ref={svg} className="cta__ring" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="cta__s1" />
            <stop offset="1" className="cta__s2" />
          </linearGradient>
          <filter id={`f${gid}`} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <rect className="cta__base" />
        <rect className="cta__glow" stroke={`url(#g${gid})`} filter={`url(#f${gid})`} />
        <rect className="cta__beam" stroke={`url(#g${gid})`} />
      </svg>
      <span className="cta__label">
        {children}
        {loading && <span className="cta__spin" aria-hidden="true" />}
      </span>
    </>
  )

  if ('href' in rest && rest.href !== undefined) {
    const a = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a
        {...a}
        ref={el as React.Ref<HTMLAnchorElement>}
        className={cls}
        aria-busy={loading || undefined}
        onClick={(e) => {
          if (loading || a['aria-disabled']) {
            e.preventDefault()
            return
          }
          a.onClick?.(e)
        }}
      >
        {inner}
      </a>
    )
  }
  const b = rest as React.ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button {...b} type={b.type ?? 'button'} ref={el as React.Ref<HTMLButtonElement>} className={cls} aria-busy={loading || undefined}>
      {inner}
    </button>
  )
})

export default Cta
