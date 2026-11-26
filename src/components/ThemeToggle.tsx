import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useTheme } from './ThemeProvider'
import './theme-toggle.css'

const Sun = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5 7 17M17 7l1.5-1.5" />
  </svg>
)
const Moon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" />
  </svg>
)

/**
 * Liquid-glass theme switch. A transparent lens rides over a recessed pill;
 * Light on the left, Dark on the right. GSAP moves the lens with a short
 * squash-and-stretch and an elastic settle; the arriving option's icon and
 * label rise through a mask. One <button role="switch">: Space/Enter toggle,
 * state is announced as "Dark theme, on/off".
 */
export default function ThemeToggle({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const { mode, toggle } = useTheme()
  const root = useRef<HTMLButtonElement>(null)
  const lens = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    const el = root.current
    const l = lens.current
    if (!el || !l) return
    const dark = mode === 'dark'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const active = el.querySelector<HTMLElement>(dark ? '[data-opt="dark"]' : '[data-opt="light"]')
    const ico = active?.querySelector('.tt__ico')
    const lab = active?.querySelector('.tt__lab-in')

    gsap.killTweensOf([l, ico, lab].filter(Boolean) as Element[])
    if (first.current || reduced) {
      first.current = false
      gsap.set(l, { xPercent: dark ? 100 : 0, scaleX: 1, scaleY: 1 })
      return
    }
    const dir = dark ? 1 : -1
    const tl = gsap.timeline()
    // travel: elastic settle on the position, squash/stretch on the glass
    tl.to(l, { xPercent: dark ? 100 : 0, duration: 0.78, ease: 'elastic.out(1, 0.7)' }, 0)
      .to(l, { scaleX: 1.2, scaleY: 0.86, skewX: -6 * dir, duration: 0.17, ease: 'power2.out' }, 0)
      .to(l, { scaleX: 1, scaleY: 1, skewX: 0, duration: 0.62, ease: 'elastic.out(1.15, 0.42)' }, 0.17)
    if (ico) tl.fromTo(ico, { rotate: dark ? -40 : 90, scale: 0.6, opacity: 0.2 }, { rotate: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' }, 0.06)
    if (lab) tl.fromTo(lab, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, 0.1)
    return () => {
      tl.kill()
    }
  }, [mode])

  const dark = mode === 'dark'
  return (
    <button
      ref={root}
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`tt ${compact ? 'tt--compact' : ''} ${className}`}
      data-mode={mode}
      onClick={toggle}
    >
      <span className="tt__track" aria-hidden="true">
        <span className={`tt__opt ${!dark ? 'is-on' : ''}`} data-opt="light">
          <span className="tt__ico tt__ico--sun"><Sun /></span>
          {!compact && (
            <span className="tt__lab">
              <span className="tt__lab-in">Light</span>
            </span>
          )}
        </span>
        <span className={`tt__opt ${dark ? 'is-on' : ''}`} data-opt="dark">
          <span className="tt__ico tt__ico--moon"><Moon /></span>
          {!compact && (
            <span className="tt__lab">
              <span className="tt__lab-in">Dark</span>
            </span>
          )}
        </span>
        <span ref={lens} className="tt__lens" />
      </span>
    </button>
  )
}
