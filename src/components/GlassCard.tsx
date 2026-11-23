import { useRef, type ReactNode } from 'react'
import { IconArrow } from './Icons'
import './glass.css'

type Props = {
  icon: ReactNode
  title: string
  text: string
  href: string
  className?: string
  /** idle float offset so the four cards never bob in sync */
  floatDelay?: number
  interactive?: boolean
}

/**
 * Single reusable glass card. All four hero cards use this component and the
 * --glass-* tokens; position is the only thing the parent controls.
 */
export default function GlassCard({ icon, title, text, href, className = '', floatDelay = 0, interactive = true }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const raf = useRef(0)

  const onMove = (e: React.PointerEvent) => {
    if (!interactive || e.pointerType !== 'mouse') return
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
      el.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`)
      el.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`)
    })
  }
  const onLeave = () => {
    const el = ref.current!
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--rx', '0deg')
  }

  return (
    <div className={`glass-float ${className}`} style={{ ['--float-delay' as string]: `${floatDelay}s` }} data-intro="card">
      <a ref={ref} className="glass-card" href={href} onPointerMove={onMove} onPointerLeave={onLeave}>
        <span className="glass-card__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="glass-card__body">
          <span className="glass-card__title">{title}</span>
          <span className="glass-card__text">{text}</span>
        </span>
        <span className="glass-card__go" aria-hidden="true">
          <IconArrow />
        </span>
      </a>
    </div>
  )
}
