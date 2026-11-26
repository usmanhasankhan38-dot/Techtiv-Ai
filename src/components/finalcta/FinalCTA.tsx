import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { PREVIEW_MODE, hasWebGL, useReducedMotion } from '../../lib/env'
import type { CtaState } from './SculptureScene'
import './finalcta.css'
import Cta from '../Cta'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* lazy: three + fiber are already in the reactor/globe chunk */
const SculptureScene = lazy(() => import('./SculptureScene'))

const base = PREVIEW_MODE ? 'https://techtivai.vercel.app' : ''
const ext = PREVIEW_MODE ? { target: '_blank', rel: 'noopener' } : {}

/* ==========================================================================
   Final CTA — "The future of intelligence"
   HTML carries every word and both CTAs (above the canvas, fully
   accessible); the canvas behind is decorative.
   Ownership: GSAP writes only numbers into a ref (enter / exit progress);
   the R3F loop reads them. Pointer writes the same ref. No React renders
   per frame, no shared animated properties.
   ========================================================================== */
export default function FinalCTA() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  const s = useRef<CtaState>({ px: 0, py: 0, inside: 0, enter: live ? 0 : 1, exit: 0, hover: -1, cf: 0.6 })
  const [webgl] = useState(() => hasWebGL())
  const [near, setNear] = useState(false)
  const [degraded, setDegraded] = useState(false)
  const [inView, setInView] = useState(false)
  const [low] = useState(() => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches)
  const fine = useRef(window.matchMedia('(hover: hover) and (pointer: fine)').matches)

  useEffect(() => {
    if (!live || degraded) s.current.enter = 1
  }, [live, degraded])

  /* mount the scene shortly before it is needed; pause it off-screen */
  useEffect(() => {
    const el = root.current!
    const pre = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '800px 0px' })
    const vis = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    pre.observe(el)
    vis.observe(el)
    return () => {
      pre.disconnect()
      vis.disconnect()
    }
  }, [])

  /* where the content ends, as a fraction of the section — the scene fits
     the sculptures below it (layout offsets: immune to entrance transforms) */
  useEffect(() => {
    const el = root.current!
    const btns = el.querySelector<HTMLElement>('.fc__btns')!
    const measure = () => {
      let y = btns.offsetHeight
      let n: HTMLElement | null = btns
      while (n && n !== el) {
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
      }
      s.current.cf = Math.min(0.8, y / el.offsetHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* pointer → normalised section coords (desktop only) */
  useEffect(() => {
    if (!fine.current || !live) return
    const el = root.current!
    let raf = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        s.current.px = ((e.clientX - r.left) / r.width) * 2 - 1
        s.current.py = ((e.clientY - r.top) / r.height) * 2 - 1
        s.current.inside = 1
      })
    }
    const leave = () => {
      s.current.inside = 0
      s.current.px = 0
      s.current.py = 0
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [live])

  useGSAP(
    () => {
      if (!live) return
      const q = gsap.utils.selector(root)
      // A + B: light, eyebrow, masked headline, copy, buttons
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.fc__amb'), { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
        .from(q('.fc__eyebrow'), { y: 12, opacity: 0, duration: 0.6 }, 0.1)
        .from(q('.fc__line > span'), { yPercent: 110, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.18)
        .from(q('.fc__desc'), { y: 16, opacity: 0, duration: 0.8 }, 0.55)
        .from(q('.fc__btns > *'), { y: 14, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.7)
      // C + D: sculptures rise in, scrubbed to the approach so reverse scroll is natural
      gsap.to(s.current, {
        enter: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 15%', scrub: 0.8 },
      })
      // E: as the page continues to the footer, they sink and recede
      gsap.to(s.current, {
        exit: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'bottom 85%', end: 'bottom top', scrub: 0.6 },
      })
    },
    { scope: root, dependencies: [live] },
  )

  // degraded devices keep a finished still frame instead of a stuttering loop
  const frameloop = !live || degraded ? 'demand' : inView ? 'always' : 'never'
  return (
    <section ref={root} id="final-cta" className={`fc ${webgl ? '' : 'fc--flat'}`} aria-labelledby="fc-title">
      <div className="fc__amb" aria-hidden="true" />
      <div className="fc__stage" aria-hidden="true">
        {webgl && near && (
          <Suspense fallback={null}>
            <SculptureScene s={s} frameloop={frameloop} low={low} onDegrade={() => setDegraded(true)} />
          </Suspense>
        )}
      </div>
      <div className="fc__content">
        <p className="fc__eyebrow">
          <span aria-hidden="true" />
          Final CTA
        </p>
        <h2 id="fc-title" className="fc__title">
          <span className="fc__line">
            <span>Your next AI move</span>
          </span>
          <span className="fc__line">
            <span>
              starts with a <em>free blueprint.</em>
            </span>
          </span>
        </h2>
        <p className="fc__desc">
          Analyze your business, talk to the AI Consultant, and get a clear plan for agents, automation, web, and apps — then build with TechTivAI.
        </p>
        <div className="fc__btns">
          <Cta className="fc__cta" href={`${base}/analyze`} {...ext} data-magnetic>
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 15c-1.5 1-2 3.5-2 6 2.5 0 5-.5 6-2M14.5 4.5C17 3 20 3 21 3c0 1 0 4-1.5 6.5L13 16l-5-5z" />
              <path d="M8 11l-3-.5L7.5 8 11 8M13 16l.5 3 2.5-2.5V13" />
              <circle cx="16" cy="8" r="1.3" />
            </svg>
            <span>Get My AI Blueprint</span>
            <svg className="fc__arr" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
            </svg>
          </Cta>
          <Cta variant="secondary" className="fc__cta" href={`${base}/contact`} {...ext} data-magnetic>
            <span>Talk to the team</span>
          </Cta>
        </div>
      </div>
    </section>
  )
}
