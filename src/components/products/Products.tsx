import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from '../../lib/env'
import { CARDS, COPY } from './productsData'
import SiteDemo from './SiteDemo'
import PortalDemo from './PortalDemo'
import MobileDemo from './MobileDemo'
import { Ic } from './Ic'
import './products.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   AI-Powered Web & App Development — three live product demos.
   Each card owns its own small state; the section only owns the entrance.

   Animation ownership
   · GSAP  — scroll entrance (head, card surfaces, interface rise)
   · CSS   — every in-product transition and the quiet ambient motion
   · React — search, tabs, chat, bookings, resets
   ========================================================================== */
export default function Products() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  const [resets, setResets] = useState<Record<string, number>>({ web: 0, app: 0, mobile: 0 })
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])

  useGSAP(
    () => {
      if (!live) return
      const q = gsap.utils.selector(root)
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.pd__beam'), { opacity: 0, scaleY: 0.4, duration: 1.4, transformOrigin: '50% 0%' }, 0)
        .from(q('.pd__eyebrow'), { y: 14, opacity: 0, duration: 0.7 }, 0.05)
        .from(q('.pd__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.12)
        .from(q('.pd__desc'), { y: 16, opacity: 0, duration: 0.8 }, 0.45)
      const cards = q('.pd-card')
      const tl = gsap.timeline({ scrollTrigger: { trigger: q('.pd__grid')[0], start: 'top 80%', once: true }, defaults: { ease: 'power3.out' } })
      // left → centre (with its light) → right; then each interface rises into the card
      tl.from(cards, { y: 48, opacity: 0, duration: 1, stagger: 0.14, clearProps: 'transform,opacity' })
        .from(q('.pd-card--app .pd-card__glow'), { opacity: 0, duration: 1.2 }, 0.3)
        .from(q('.pd-card__ui'), { y: 40, opacity: 0, duration: 1.1, stagger: 0.14, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.35)
        .from(q('.pd__note'), { opacity: 0, duration: 0.8 }, 0.9)
    },
    { scope: root, dependencies: [live] },
  )

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!live || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  }
  const reset = (id: string) => setResets((r) => ({ ...r, [id]: r[id] + 1 }))

  return (
    <section ref={root} id="web-app-development" className={`pd ${inView ? '' : 'is-offscreen'}`} aria-labelledby="pd-title">
      <div className="pd__beam" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="pd__head">
        <p className="pd__eyebrow">
          <span aria-hidden="true" />
          {COPY.eyebrow}
        </p>
        <h2 id="pd-title" className="pd__title">
          <span className="pd__line">
            <span>{COPY.title[0]}</span>
          </span>
          <span className="pd__line pd__line--accent">
            <span>{COPY.title[1]}</span>
          </span>
        </h2>
        <p className="pd__desc">{COPY.desc}</p>
      </header>

      <div className="pd__grid">
        {CARDS.map((c) => (
          <article key={c.id} className={`pd-card pd-card--${c.id}`} onPointerMove={onMove} aria-labelledby={`pd-${c.id}`}>
            {c.id === 'app' && <span className="pd-card__glow" aria-hidden="true" />}
            <header className="pd-card__head">
              <div className="pd-card__row">
                <p className="pd-card__n">
                  <i aria-hidden="true" /> {c.n}
                </p>
                <button type="button" className="pd-card__reset" onClick={() => reset(c.id)} aria-label={`Reset the ${c.t} demo`}>
                  <Ic n="reset" s={13} /> Reset
                </button>
              </div>
              <h3 id={`pd-${c.id}`}>{c.t}</h3>
              <p>{c.d}</p>
            </header>
            <div className="pd-card__ui">
              {c.id === 'web' && <SiteDemo live={live} resetKey={resets.web} />}
              {c.id === 'app' && <PortalDemo resetKey={resets.app} />}
              {c.id === 'mobile' && <MobileDemo live={live} resetKey={resets.mobile} />}
            </div>
          </article>
        ))}
      </div>
      <p className="pd__note">{COPY.note}</p>
    </section>
  )
}
