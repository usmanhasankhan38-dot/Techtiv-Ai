import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { IArrowUpRight, IClose, IMenu } from './v2/Icon'
import { PREVIEW_MODE, previewNotice, useReducedMotion } from '../lib/env'
import { DUR, EASE, STAGGER } from '../lib/motion'
import './nav.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Same destinations as the live site's navigation (nothing removed). */
const LINKS = [
  { label: 'Analyze', href: '/analyze' },
  { label: 'Discovery', href: '/discovery' },
  { label: 'Services', href: '/services' },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
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

export default function Nav() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  /* ---- scroll state: compact smoked bar after the first scroll; hides while
          reading downward, returns as soon as the visitor scrolls back up ---- */
  useGSAP(
    () => {
      const el = root.current!
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const y = self.scroll()
          el.classList.toggle('is-scrolled', y > 24)
          const hide = !reduced && y > window.innerHeight * 0.9 && self.direction === 1 && !el.contains(document.activeElement)
          el.classList.toggle('is-hidden', hide)
        },
      })
    },
    { dependencies: [reduced] },
  )

  /* ---- hover indicator: one small lime bar glides between links ---- */
  const moveDot = (target: HTMLElement | null) => {
    const d = dot.current
    if (!d) return
    if (!target) {
      gsap.to(d, { opacity: 0, duration: DUR.ui, ease: EASE.enter })
      return
    }
    const list = d.parentElement!.getBoundingClientRect()
    const r = target.getBoundingClientRect()
    gsap.to(d, {
      x: r.left - list.left,
      width: r.width,
      opacity: 1,
      duration: reduced ? 0 : 0.55,
      ease: 'expo.out',
    })
  }

  /* ---- mobile menu: masked panel, staggered rows, focus kept inside ---- */
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const rows = panel.querySelectorAll('[data-row]')
    if (open) {
      panel.hidden = false
      document.body.style.overflow = 'hidden'
      gsap.killTweensOf([panel, rows])
      if (reduced) {
        gsap.set(panel, { clipPath: 'inset(0 0 0% 0)' })
        gsap.set(rows, { yPercent: 0, opacity: 1 })
      } else {
        gsap.fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut' })
        gsap.fromTo(rows, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: DUR.reveal, ease: EASE.reveal, stagger: STAGGER.tight, delay: 0.25 })
      }
      panel.querySelector<HTMLElement>('a')?.focus({ preventScroll: true })
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false)
          btnRef.current?.focus()
        }
        if (e.key === 'Tab') {
          const f = [btnRef.current!, ...panel.querySelectorAll<HTMLElement>('a')]
          const i = f.indexOf(document.activeElement as HTMLElement)
          if (e.shiftKey && i <= 0) {
            e.preventDefault()
            f[f.length - 1].focus()
          } else if (!e.shiftKey && i === f.length - 1) {
            e.preventDefault()
            f[0].focus()
          }
        }
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
    document.body.style.overflow = ''
    if (panel.hidden) return
    if (reduced) {
      panel.hidden = true
      return
    }
    gsap.to(panel, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.55,
      ease: 'expo.inOut',
      onComplete: () => {
        panel.hidden = true
      },
    })
  }, [open, reduced])

  // close the panel if the viewport grows to desktop while it is open
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1100px)')
    const on = () => mq.matches && setOpen(false)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return (
    <header ref={root} className={`nav ${open ? 'is-open' : ''}`} data-intro="nav">
      <div className="nav__inner v-container">
        <span data-nav-item>
          <Logo />
        </span>

        <nav className="nav__links" aria-label="Primary" onMouseLeave={() => moveDot(null)}>
          <ul>
            {LINKS.map((l, i) => (
              <li key={l.href} data-nav-item>
                <a
                  href={l.href}
                  onClick={(e) => onExternalRoute(e, l.label)}
                  onMouseEnter={(e) => moveDot(e.currentTarget)}
                  onFocus={(e) => moveDot(e.currentTarget)}
                  onBlur={() => moveDot(null)}
                >
                  <span className="nav__idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <span ref={dot} className="nav__dot" aria-hidden="true" />
        </nav>

        <div className="nav__actions" data-nav-item>
          <a className="nav__login" href="/login" onClick={(e) => onExternalRoute(e, 'Login')}>
            Login
          </a>
          <a className="v-btn v-btn--primary v-btn--sm nav__cta" href="/analyze" data-magnetic onClick={(e) => onExternalRoute(e, 'Analyze free')}>
            Analyze free
            <span className="v-btn__chip"><IArrowUpRight /></span>
          </a>
          <button
            ref={btnRef}
            className="nav__menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav__menu-label">{open ? 'Close' : 'Menu'}</span>
            {open ? <IClose /> : <IMenu />}
          </button>
        </div>
      </div>
      <span className="nav__rule v-rule" aria-hidden="true" />

      <div id="mobile-menu" ref={panelRef} className="nav__panel" hidden>
        <div className="nav__panel-inner v-container">
          <p className="v-label" data-row>
            <span className="v-label__idx">Menu</span>
            <span className="v-label__bar" />
            TechtivAI
          </p>
          <ul className="nav__panel-list">
            {LINKS.map((l, i) => (
              <li key={l.href} data-row>
                <a href={l.href} onClick={(e) => { onExternalRoute(e, l.label); setOpen(false) }}>
                  <span className="nav__panel-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="nav__panel-t">{l.label}</span>
                  <IArrowUpRight className="nav__panel-arr" />
                </a>
              </li>
            ))}
          </ul>
          <div className="nav__panel-foot" data-row>
            <a className="nav__login" href="/login" onClick={(e) => { onExternalRoute(e, 'Login'); setOpen(false) }}>
              Login
            </a>
            <a className="v-btn v-btn--primary" href="/analyze" onClick={(e) => { onExternalRoute(e, 'Analyze free'); setOpen(false) }}>
              Analyze free
              <span className="v-btn__chip"><IArrowUpRight /></span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
