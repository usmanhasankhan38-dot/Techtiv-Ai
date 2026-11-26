import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import AgentForce from './AgentForce'
import AgentBento from './bento/AgentBento'
import { COPY } from './agenticData'
import { IconArrow } from '../Icons'
import { PREVIEW_MODE, useReducedMotion } from '../../lib/env'
import './agentic.css'
import Cta from '../Cta'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Live CTA → /analyze. This standalone preview opens the live flow. */
const CTA_URL = PREVIEW_MODE ? 'https://techtivai.vercel.app/analyze' : '/analyze'

export default function Agentic() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  // idle motion rests off-screen
  useEffect(() => {
    const el = root.current!
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-offscreen', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useGSAP(
    () => {
      if (reduced) return
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%' }, defaults: { ease: 'power3.out' } })
      tl.from(q('.ag__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.ag__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.ag__desc'), { y: 16, opacity: 0, duration: 0.8 }, 0.45)
      gsap
        .timeline({ scrollTrigger: { trigger: q('.af-stage')[0], start: 'top 75%' }, defaults: { ease: 'expo.out' } })
        .from(q('.ag__feat > *'), { y: 14, opacity: 0, duration: 0.8, stagger: 0.08 }, 0)
        .from(q('.af-core'), { scale: 0.55, opacity: 0, duration: 1.6, clearProps: 'transform,opacity' }, 0.1)
        .from(q('.af-col--left .afc'), { x: -40, opacity: 0, duration: 1.1, stagger: 0.12, clearProps: 'transform,opacity' }, 0.45)
        .from(q('.af-col--right .afc'), { x: 40, opacity: 0, duration: 1.1, stagger: 0.12, clearProps: 'transform,opacity' }, 0.55)
        .from(q('.af-strip, .ag__cta'), { y: 18, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.8)
      // Chapter 02 → 03: the network's light hands over to the bento (scrubbed,
      // opacity/transform only, never touches the interactive layers)
      gsap.fromTo(
        q('.ag-bento__light'),
        { opacity: 0, yPercent: -18 },
        { opacity: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: q('.ag-bento')[0], start: 'top bottom', end: 'top 25%', scrub: 0.6 } },
      )
      gsap.fromTo(
        q('.ag__atmos'),
        { opacity: 1 },
        { opacity: 0.35, ease: 'none', scrollTrigger: { trigger: q('.ag-bento')[0], start: 'top 90%', end: 'top 20%', scrub: 0.6 } },
      )
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section ref={root} id="agentic-solutions" className="ag" aria-labelledby="ag-title">
      <div className="ag__atmos" aria-hidden="true" />
      <header className="ag__head">
        <p className="ag__eyebrow">
          <span className="ag__eyebrow-dot" aria-hidden="true" />
          {COPY.eyebrow}
        </p>
        <h2 id="ag-title" className="ag__title">
          <span className="ag__line">
            <span>{COPY.title[0]}</span>
          </span>
          <span className="ag__line ag__line--accent">
            <span>{COPY.title[1]}</span>
          </span>
        </h2>
        <p className="ag__desc">{COPY.desc}</p>
      </header>

      {/* Part A — featured suite */}
      <div className="ag__feat">
        <p className="ag__feat-k">Featured</p>
        <p className="ag__feat-name">
          {COPY.featured} <span>{COPY.featuredAccent}</span>
        </p>
        <p className="ag__feat-desc">{COPY.featuredDesc}</p>
      </div>
      <AgentForce live={live} />
      <div className="ag__cta">
        <Cta href={CTA_URL} target={PREVIEW_MODE ? '_blank' : undefined} rel={PREVIEW_MODE ? 'noopener' : undefined} data-magnetic>
          {COPY.cta} <IconArrow />
        </Cta>
      </div>

      {/* Part B — the seven agents (own state + clock) */}
      <AgentBento live={live} />
    </section>
  )
}
