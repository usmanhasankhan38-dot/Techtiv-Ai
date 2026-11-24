import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { PREVIEW_MODE, useReducedMotion } from '../../lib/env'
import { CHAPTERS, COPY } from './blueprintData'
import { V1, V2, V3, V4, V5 } from './Visuals'
import './blueprint.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   Blueprint Preview — "The intelligence blueprint"
   Desktop: a sticky report stage beside a scroll-driven chapter timeline
   (natural scroll, no pin). Mobile: stage + chapter tabs, no scroll-jacking.

   Ownership
   · React  — `active` chapter (one source of truth for stage + timeline)
   · GSAP   — entrance, ScrollTriggers that set `active`, scrubbed rail
   · CSS    — each visual's reveal, keyed to `.is-on`
   A click sets `active` at once and locks scroll updates until the smooth
   scroll lands, so the stage never flickers through the chapters between.
   ========================================================================== */
const CTA_URL = PREVIEW_MODE ? 'https://techtivai.vercel.app/analyze' : '/analyze'
const VISUALS: ((p: { on: boolean }) => React.ReactElement)[] = [V1, V2, V3, V4, V5]

export default function Blueprint() {
  const root = useRef<HTMLElement>(null)
  const chapters = useRef<(HTMLLIElement | null)[]>([])
  const reduced = useReducedMotion()
  const live = !reduced
  const [active, setActive] = useState(0)
  const [desk, setDesk] = useState(() => window.matchMedia('(min-width: 760px)').matches)
  const lock = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 760px)')
    const on = () => setDesk(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      if (desk) {
        chapters.current.forEach((el, i) => {
          if (!el) return
          ScrollTrigger.create({
            trigger: el,
            start: 'top 58%',
            end: 'bottom 58%',
            onToggle: (self) => {
              if (self.isActive && performance.now() > lock.current) setActive(i)
            },
          })
        })
        gsap.fromTo(
          q('.bp-rail__fill'),
          { scaleY: 0 },
          { scaleY: 1, ease: 'none', scrollTrigger: { trigger: q('.bp-chapters')[0], start: 'top 58%', end: 'bottom 58%', scrub: 0.4 } },
        )
      }
      if (!live) return
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.bp__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.bp__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.bp__desc, .bp__cta'), { y: 16, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.45)
      gsap
        .timeline({ scrollTrigger: { trigger: q('.bp-body')[0], start: 'top 80%', once: true }, defaults: { ease: 'expo.out' } })
        .from(q('.bp-stage'), { y: 50, opacity: 0, scale: 0.97, duration: 1.3, clearProps: 'transform,opacity' })
        .from(q('.bp-rail'), { scaleY: 0, transformOrigin: '50% 0%', duration: 1.2, ease: 'power2.inOut' }, 0.2)
        .from(q('.bp-ch, .bp-tabs'), { x: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.3)
    },
    { scope: root, dependencies: [desk, live], revertOnUpdate: true },
  )

  const go = useCallback(
    (i: number) => {
      setActive(i)
      if (!desk) return
      const el = chapters.current[i]
      if (!el) return
      const r = el.getBoundingClientRect()
      // land the chapter's centre on the trigger line (58% of the viewport)
      const y = r.top + window.scrollY + r.height / 2 - window.innerHeight * 0.58
      lock.current = performance.now() + (live ? 1100 : 50)
      window.scrollTo({ top: Math.max(0, y), behavior: live ? 'smooth' : 'auto' })
    },
    [desk, live],
  )

  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const i = Math.max(0, Math.min(CHAPTERS.length - 1, active + d))
    go(i)
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-ch="${i}"]`)?.focus({ preventScroll: true }))
  }

  const ch = CHAPTERS[active]
  const done = active === CHAPTERS.length - 1

  const stage = (
    <div className={`bp-stage ${done ? 'is-final' : ''}`}>
      <span className="bp-stage__light" aria-hidden="true" />
      <header className="bp-stage__bar">
        <span className="bp-stage__doc">
          <i aria-hidden="true" /> AI Blueprint · <em>Sample Co.</em>
        </span>
        <span className="bp-stage__prog" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <i key={c.n} className={i === active ? 'is-on' : i < active ? 'is-past' : ''} />
          ))}
        </span>
        <span className="bp-stage__n">
          Chapter <b>{ch.n}</b> / 05
        </span>
      </header>
      <div className="bp-stage__view">
        {VISUALS.map((V, i) => (
          <div key={i} className={`bp-vis ${i === active ? 'is-on' : i < active ? 'is-past' : ''}`} aria-hidden={i !== active} inert={i !== active}>
            <V on={i === active} />
          </div>
        ))}
      </div>
      <footer className="bp-stage__foot" aria-live="polite">
        <span className="bp-stage__k">In this chapter</span>
        <span className="bp-stage__items" key={active}>
          {ch.items.map((t, i) => (
            <span key={t} style={{ ['--i' as string]: i }}>
              <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                <path d="m3.5 8.4 2.9 2.9 6-6.4" />
              </svg>
              {t}
            </span>
          ))}
        </span>
      </footer>
    </div>
  )

  return (
    <section ref={root} id="blueprint-preview" className={`bp ${desk ? 'bp--desk' : 'bp--mob'}`} aria-labelledby="bp-title">
      <div className="bp__amb" aria-hidden="true" />
      <div className="bp__inner">
        <header className="bp__head">
          <div>
            <p className="bp__eyebrow">
              <span aria-hidden="true" />
              {COPY.eyebrow}
            </p>
            <h2 id="bp-title" className="bp__title">
              <span className="bp__line">
                <span>{COPY.title[0]}</span>
              </span>
              <span className="bp__line bp__line--accent">
                <span>{COPY.title[1]}</span>
              </span>
            </h2>
          </div>
          <div className="bp__aside">
            <p className="bp__desc">{COPY.desc}</p>
            <a className="btn btn--primary bp__cta" href={CTA_URL} target={PREVIEW_MODE ? '_blank' : undefined} rel={PREVIEW_MODE ? 'noopener' : undefined} data-magnetic>
              {COPY.cta}
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
              </svg>
            </a>
          </div>
        </header>

        <div className="bp-body">
          <div className="bp-left">{stage}</div>

          <div className="bp-right">
            {desk ? (
              <>
                <p className="bp-right__k">
                  11 report sections <span>·</span> 5 chapters
                </p>
                <div className="bp-tl">
                  <span className="bp-rail" aria-hidden="true">
                    <span className="bp-rail__fill" />
                  </span>
                  <ol className="bp-chapters" role="list" onKeyDown={onKey}>
                    {CHAPTERS.map((c, i) => (
                      <li key={c.n} ref={(el) => void (chapters.current[i] = el)} className={`bp-ch ${i === active ? 'is-on' : i < active ? 'is-past' : ''}`}>
                        <button type="button" data-ch={i} className="bp-ch__btn" aria-current={i === active ? 'step' : undefined} onClick={() => go(i)}>
                          <span className="bp-ch__dot" aria-hidden="true" />
                          <span className="bp-ch__n">Chapter {c.n}</span>
                          <span className="bp-ch__t">{c.t}</span>
                          <span className="bp-ch__d">{c.d}</span>
                          <span className="bp-ch__items">
                            {c.items.map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className={`bp-end ${done ? 'is-cue' : ''}`}>
                  <p>
                    <b>Your report, assembled.</b> All 11 sections, delivered as your blueprint and PDF.
                  </p>
                  <a className="btn btn--primary" href={CTA_URL} target={PREVIEW_MODE ? '_blank' : undefined} rel={PREVIEW_MODE ? 'noopener' : undefined} data-magnetic>
                    {COPY.cta}
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
                    </svg>
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="bp-tabs" role="tablist" aria-label="Blueprint chapters" onKeyDown={onKey}>
                  {CHAPTERS.map((c, i) => (
                    <button
                      key={c.n}
                      type="button"
                      role="tab"
                      data-ch={i}
                      aria-selected={i === active}
                      aria-controls="bp-mpanel"
                      tabIndex={i === active ? 0 : -1}
                      className={i === active ? 'is-on' : i < active ? 'is-past' : ''}
                      onClick={() => go(i)}
                    >
                      {c.n}
                    </button>
                  ))}
                </div>
                <div id="bp-mpanel" role="tabpanel" className="bp-mch" key={active}>
                  <p className="bp-ch__n">Chapter {ch.n}</p>
                  <p className="bp-ch__t">{ch.t}</p>
                  <p className="bp-ch__d">{ch.d}</p>
                  <div className="bp-mnav">
                    <button type="button" onClick={() => go(active - 1)} disabled={active === 0}>
                      ← Previous
                    </button>
                    <button type="button" onClick={() => go(active + 1)} disabled={done}>
                      Next chapter →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
