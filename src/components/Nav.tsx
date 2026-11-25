import { useEffect, useRef, useState } from 'react'
import { IconArrow, IconClose, IconMenu } from './Icons'
import { PREVIEW_MODE, previewNotice } from '../lib/env'
import './nav.css'

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
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const first = panelRef.current?.querySelector<HTMLElement>('a')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="nav" data-intro="nav">
      <div className="nav__inner">
        <Logo />
        <nav className="nav__links" aria-label="Primary">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={(e) => onExternalRoute(e, l.label)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav__actions">
          <a className="nav__login" href="/login" onClick={(e) => onExternalRoute(e, 'Login')}>
            Login
          </a>
          <a className="btn btn--primary btn--sm" href="/analyze" data-magnetic onClick={(e) => onExternalRoute(e, 'Analyze free')}>
            Analyze free <IconArrow />
          </a>
          <button
            ref={btnRef}
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

      <div id="mobile-menu" ref={panelRef} className={`nav__panel ${open ? 'is-open' : ''}`} hidden={!open}>
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => { onExternalRoute(e, l.label); setOpen(false) }}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/login" onClick={(e) => { onExternalRoute(e, 'Login'); setOpen(false) }}>
              Login
            </a>
          </li>
        </ul>
        <a className="btn btn--primary" href="/analyze" onClick={(e) => { onExternalRoute(e, 'Analyze free'); setOpen(false) }}>
          Analyze free <IconArrow />
        </a>
      </div>
    </header>
  )
}
