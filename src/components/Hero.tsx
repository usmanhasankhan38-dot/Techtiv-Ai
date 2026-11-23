import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import GlassCard from './GlassCard'
import { IconAgents, IconArrow, IconConsultant, IconSearch, IconWebApp, IconWorkflow } from './Icons'
import { useReducedMotion } from '../lib/env'
import { globeAnchors, sceneMotion } from '../lib/store'
import { GlobeFallback } from './GlobeLayer'
import './hero.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Card copy is paraphrased from services already described on techtivai.vercel.app. */
const CARDS = [
  { key: 'agents', title: 'AI Agents', text: 'Sales, support and ops agents that work around the clock.', icon: <IconAgents />, pos: 'tl', delay: 0 },
  { key: 'workflow', title: 'Workflow Automation', text: 'CRM, sales and email flows on n8n, Make, Zapier and GHL.', icon: <IconWorkflow />, pos: 'bl', delay: 1.6 },
  { key: 'consultant', title: 'AI Consultant', text: 'Personal recommendations, grounded in your business.', icon: <IconConsultant />, pos: 'tr', delay: 0.8 },
  { key: 'webapp', title: 'Web & App Development', text: 'Websites, portals and mobile apps with AI built in.', icon: <IconWebApp />, pos: 'br', delay: 2.4 },
] as const

/* Truthful descriptors only — no invented metrics. Each item is stated on the live site. */
const STRIP = [
  { k: 'Agents', v: 'LangGraph · CrewAI' },
  { k: 'Automation', v: 'n8n · Make · Zapier · GHL' },
  { k: 'Consulting', v: 'Text chat + voice' },
  { k: 'Builds', v: 'Web · SaaS · Mobile' },
]

export default function Hero({ webgl }: { webgl: boolean }) {
  const root = useRef<HTMLElement>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    globeAnchors.hero = anchor.current
    return () => {
      globeAnchors.hero = null
    }
  }, [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      if (reduced) {
        sceneMotion.reveal = 1
        sceneMotion.orbits = 1
        gsap.set(q('[data-intro]'), { clearProps: 'all', opacity: 1 })
        return
      }

      // ---------- intro choreography ----------
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from(document.querySelectorAll('[data-intro="nav"]'), { y: -24, opacity: 0, duration: 0.9 }, 0.1)
        .from(q('[data-intro="eyebrow"]'), { y: 14, opacity: 0, duration: 0.8 }, 0.25)
        .from(q('.hero__line > span'), { yPercent: 115, rotate: 2.5, duration: 1.15, stagger: 0.11, ease: 'expo.out' }, 0.32)
        .from(q('[data-intro="copy"]'), { y: 16, opacity: 0, duration: 0.9 }, 0.72)
        .from(q('[data-intro="cta"]'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.09 }, 0.85)
        .fromTo(sceneMotion, { reveal: 0 }, { reveal: 1, duration: 2.4, ease: 'power2.inOut' }, 0.45)
        .fromTo(sceneMotion, { orbits: 0 }, { orbits: 1, duration: 2.2, ease: 'power2.inOut' }, 1.1)
        .from(q('[data-intro="card"]'), { y: 26, opacity: 0, scale: 0.96, filter: 'blur(8px)', duration: 1.0, stagger: 0.12, clearProps: 'filter' }, 1.35)
        .from(q('[data-intro="strip"]'), { y: 24, opacity: 0, duration: 0.9 }, 1.75)

      // ---------- scroll: copy and cards clear, globe settles in ----------
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1100px)', () => {
        const st = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
        })
        st.to(q('.hero__copy'), { y: -90, opacity: 0, ease: 'none', duration: 0.6 }, 0)
          .to(q('.hero__card--tl, .hero__card--bl'), { x: -80, opacity: 0, ease: 'none', duration: 0.55 }, 0.05)
          .to(q('.hero__card--tr, .hero__card--br'), { x: 80, opacity: 0, ease: 'none', duration: 0.55 }, 0.05)
          .to(q('.hero__strip'), { y: 50, opacity: 0, ease: 'none', duration: 0.45 }, 0)
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="hero__stage">

        {/* the shared globe (fixed canvas, see GlobeLayer) follows this anchor */}
        <div className="hero__globe" aria-hidden="true">
          <div ref={anchor} className="globe-anchor hero__globe-anchor">
            {!webgl && <GlobeFallback />}
          </div>
        </div>

        <div className="hero__copy">
          <p className="hero__eyebrow" data-intro="eyebrow">
            <span className="hero__eyebrow-dot" aria-hidden="true" />
            Intelligence, engineered for business
          </p>
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line"><span>Your Business.</span></span>
            <span className="hero__line hero__line--accent"><span>Beyond Ordinary.</span></span>
          </h1>
          <p className="hero__sub" data-intro="copy">
            AI-powered automation, intelligent agents, and digital experiences designed to move your business forward.
          </p>
          <div className="hero__ctas">
            <span data-intro="cta">
              <a className="btn btn--primary" href="#technology" data-magnetic>
                Explore Solutions <IconArrow />
              </a>
            </span>
            <span data-intro="cta">
              <a className="btn btn--ghost" href="#technology" data-magnetic>
                See How It Works
              </a>
            </span>
          </div>
        </div>

        <ul className="hero__cards" aria-label="What TechtivAI builds">
          {CARDS.map((c) => (
            <li key={c.key} className={`hero__card hero__card--${c.pos}`}>
              <GlassCard icon={c.icon} title={c.title} text={c.text} href="#technology" floatDelay={c.delay} interactive={!reduced} />
            </li>
          ))}
        </ul>

        <div className="hero__strip glass" data-intro="strip">
          <div className="hero__strip-lead">
            <span className="hero__strip-icon" aria-hidden="true">
              <IconSearch />
            </span>
            <p>
              <strong>Research first.</strong> We study your business before recommending anything.
            </p>
          </div>
          <dl className="hero__strip-list">
            {STRIP.map((s) => (
              <div key={s.k}>
                <dt>{s.k}</dt>
                <dd>{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

      </div>
    </section>
  )
}
