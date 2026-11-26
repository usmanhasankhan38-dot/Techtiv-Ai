import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { IconArrow, IconClose, IconMenu } from './Icons'
import { PREVIEW_MODE, previewNotice } from '../lib/env'
import Cta from './Cta'
import ThemeToggle from './ThemeToggle'
import './nav.css'

/* Same destinations as the live site's navigation (nothing removed, nothing added).
   `section` only tells the active-state detector which on-page section stands
   for that route in this one-page preview; the link's href is unchanged. */
const LINKS = [
  { label: 'Analyze', href: '/analyze' },
  { label: 'Discovery', href: '/discovery' },
  { label: 'Services', href: '/services' },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing', section: 'pricing' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Contact', href: '/contact' },
]

export function onExternalRoute(e: React.MouseEvent<HTMLAnchorElement>, label: string) {
  const href = e.currentTarget.getAttribute('href') || ''
  if (PREVIEW_MODE && href.startsWith('/')) {
    e.preventDefault()
    previewNotice(label)
  }
}

export function Logo() {
  return (
    <a className="logo" href="/" aria-label="TechtivAI home" onClick={(e) => onExternalRoute(e, 'Home')}>
      <span className="logo__mark" aria-hidden="true">T</span>
      <span className="logo__word">
        Techtiv<em>AI</em>
      </span>
    </a>
  )
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLUListElement>(null)
  const glowRef = useRef<HTMLLIElement>(null)
  const glowTo = useRef<{ x: gsap.QuickToFunc; w: gsap.QuickToFunc } | null>(null)

  /* ---------- scroll state + section-based active item ---------- */
  useEffect(() => {
    const sections = LINKS.filter((l) => l.section).map((l) => ({ id: l.section!, label: l.label }))
    let raf = 0
    const read = () => {
      raf = 0
      setScrolled(window.scrollY > 24)
      const probe = window.innerHeight * 0.4
      let hit: string | null = null
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= probe && r.bottom > probe) hit = s.label
      }
      setActive(hit)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  /* ---------- hover light along the rail's lower edge ---------- */
  useLayoutEffect(() => {
    const g = glowRef.current
    if (!g) return
    gsap.set(g, { opacity: 0, x: 0, width: 60 })
    glowTo.current = {
      x: gsap.quickTo(g, 'x', { duration: 0.5, ease: 'power3.out' }),
      w: gsap.quickTo(g, 'width', { duration: 0.5, ease: 'power3.out' }),
    }
    return () => {
      gsap.killTweensOf(g)
    }
  }, [])

  const lightUp = useCallback((target: HTMLElement | null, instant = false) => {
    const g = glowRef.current
    const rail = railRef.current
    if (!g || !rail || !glowTo.current) return
    if (!target) {
      gsap.to(g, { opacity: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
      return
    }
    const rr = rail.getBoundingClientRect()
    const tr = target.getBoundingClientRect()
    const w = tr.width * 0.86
    const x = tr.left - rr.left + (tr.width - w) / 2
    const fromHidden = Number(gsap.getProperty(g, 'opacity')) < 0.05
    if (instant || fromHidden || reducedMotion()) {
      gsap.set(g, { x, width: w })
      glowTo.current.x(x)
      glowTo.current.w(w)
      // quickTo needs its own start value synced, then jump
      gsap.set(g, { x, width: w })
    } else {
      glowTo.current.x(x)
      glowTo.current.w(w)
    }
    gsap.to(g, { opacity: 1, duration: reducedMotion() ? 0 : 0.3, ease: 'power2.out', overwrite: 'auto' })
  }, [])

  const onRailLeave = () => {
    lightUp(null)
  }

  /* ---------- mobile panel: GSAP in / out, staggered links ---------- */
  useEffect(() => {
    if (open) setRendered(true)
  }, [open])

  useLayoutEffect(() => {
    const p = panelRef.current
    if (!p || !rendered) return
    const items = p.querySelectorAll('[data-stagger]')
    const rm = reducedMotion()
    if (open) {
      gsap.killTweensOf([p, ...items])
      if (rm) {
        gsap.set([p, ...items], { clearProps: 'all' })
      } else {
        gsap.fromTo(p, { opacity: 0, y: -12, clipPath: 'inset(0 0 100% 0 round 20px)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 20px)', duration: 0.5, ease: 'power3.out' })
        gsap.fromTo(items, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.045, delay: 0.1 })
      }
      p.querySelector<HTMLElement>('a')?.focus({ preventScroll: true })
    } else {
      if (rm) {
        setRendered(false)
        return
      }
      gsap.killTweensOf([p, ...items])
      gsap.to(items, { opacity: 0, y: -8, duration: 0.18, ease: 'power2.in', stagger: { each: 0.02, from: 'end' } })
      gsap.to(p, { opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0 round 20px)', duration: 0.32, ease: 'power3.in', delay: 0.08, onComplete: () => setRendered(false) })
    }
  }, [open, rendered])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    const mq = window.matchMedia('(min-width: 1240px)')
    const onMq = () => mq.matches && setOpen(false)
    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`} data-intro="nav">
      <div className="nav__inner">
        <Logo />
        <nav className="nav__links" aria-label="Primary">
          <ul ref={railRef} className="nav__rail" onMouseLeave={onRailLeave}>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={active === l.label ? 'is-active' : undefined}
                  aria-current={active === l.label ? 'location' : undefined}
                  onClick={(e) => onExternalRoute(e, l.label)}
                  onMouseEnter={(e) => lightUp(e.currentTarget)}
                  onFocus={(e) => lightUp(e.currentTarget, false)}
                  onBlur={(e) => {
                    if (!railRef.current?.contains(e.relatedTarget as Node)) lightUp(null)
                  }}
                >
                  <span className="nav__txt">{l.label}</span>
                </a>
              </li>
            ))}
            <li ref={glowRef} className="nav__glow" aria-hidden="true" role="presentation">
              <span className="nav__glow-haze" />
              <span className="nav__glow-line" />
            </li>
          </ul>
        </nav>
        <div className="nav__actions">
          <a className="nav__login" href="/login" onClick={(e) => onExternalRoute(e, 'Login')}>
            Login
          </a>
          <ThemeToggle className="nav__tt nav__tt--full" />
          <ThemeToggle compact className="nav__tt nav__tt--compact" />
          <Cta size="sm" className="nav__cta" href="/analyze" data-magnetic onClick={(e) => onExternalRoute(e, 'Analyze free')}>
            Analyze free <IconArrow />
          </Cta>
          <button
            ref={btnRef}
            type="button"
            className="nav__menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={panelRef} className="nav__panel" hidden={!rendered}>
        <div className="nav__panel-head" data-stagger>
          <span className="nav__panel-kicker">Menu</span>
        </div>
        <ul>
          {LINKS.map((l) => (
            <li key={l.href} data-stagger>
              <a
                href={l.href}
                className={active === l.label ? 'is-active' : undefined}
                aria-current={active === l.label ? 'location' : undefined}
                onClick={(e) => { onExternalRoute(e, l.label); close() }}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li data-stagger>
            <a href="/login" onClick={(e) => { onExternalRoute(e, 'Login'); close() }}>
              Login
            </a>
          </li>
        </ul>
        <div className="nav__panel-foot" data-stagger>
          <div className="nav__panel-theme">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
          <Cta block href="/analyze" onClick={(e) => { onExternalRoute(e, 'Analyze free'); close() }}>
            Analyze free <IconArrow />
          </Cta>
        </div>
      </div>
    </header>
  )
}
