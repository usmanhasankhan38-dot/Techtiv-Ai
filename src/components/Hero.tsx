import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { IAgents, IArrow, IArrowUpRight, IConsultant, IResearch, IWebApp, IWorkflow } from './v2/Icon'
import { useReducedMotion } from '../lib/env'
import { globeAnchors, sceneMotion } from '../lib/store'
import { DUR, EASE, SCRUB, STAGGER } from '../lib/motion'
import { GlobeFallback } from './GlobeLayer'
import './hero.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Card copy is paraphrased from services already described on techtivai.vercel.app (unchanged from V1). */
const CAPS = [
  { key: 'agents', title: 'AI Agents', text: 'Sales, support and ops agents that work around the clock.', Icon: IAgents, side: 'l' },
  { key: 'workflow', title: 'Workflow Automation', text: 'CRM, sales and email flows on n8n, Make, Zapier and GHL.', Icon: IWorkflow, side: 'l' },
  { key: 'consultant', title: 'AI Consultant', text: 'Personal recommendations, grounded in your business.', Icon: IConsultant, side: 'r' },
  { key: 'webapp', title: 'Web & App Development', text: 'Websites, portals and mobile apps with AI built in.', Icon: IWebApp, side: 'r' },
] as const

/* Truthful descriptors only — no invented metrics. Each item is stated on the live site. */
const SPEC = [
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
        return
      }

      /* ================= entrance (does not block interaction) =================
         1 light establishes · 2 nav · 3 headline · 4 core emerges · 5 copy + CTA · 6 ambient */
      const navItems = document.querySelectorAll('.nav [data-nav-item]')
      const tl = gsap.timeline({ defaults: { ease: EASE.enter } })
      tl.fromTo(q('.hero__atmos'), { opacity: 0 }, { opacity: 1, duration: DUR.scene, ease: EASE.scene }, 0)
        .fromTo('.nav__rule', { scaleX: 0 }, { scaleX: 1, duration: DUR.hero, ease: EASE.reveal }, 0.15)
        .from(navItems, { y: -14, opacity: 0, duration: DUR.reveal, stagger: STAGGER.tight }, 0.2)
        .from(q('.hero__meta .v-rule'), { scaleX: 0, duration: DUR.hero, ease: EASE.reveal }, 0.3)
        .from(q('.hero__meta > *:not(.v-rule)'), { y: 10, opacity: 0, duration: DUR.reveal, stagger: STAGGER.base }, 0.35)
        .from(q('.hero__title .v-mask > span'), { yPercent: 108, duration: DUR.hero, ease: EASE.reveal, stagger: 0.12 }, 0.42)
        .from(q('.hero__title'), { letterSpacing: '0.01em', duration: 1.8, ease: EASE.reveal }, 0.42)
        .fromTo(sceneMotion, { reveal: 0 }, { reveal: 1, duration: DUR.scene + 0.4, ease: EASE.scene }, 0.7)
        .from(q('.hero__intro > *'), { y: 22, opacity: 0, duration: DUR.reveal, stagger: STAGGER.base }, 1.05)
        .from(q('.hero__spec-lead, .hero__spec-row'), { y: 14, opacity: 0, duration: DUR.reveal, stagger: STAGGER.tight }, 1.2)
        .from(q('.hero__spec-row'), { '--rule': 0, duration: DUR.hero, ease: EASE.reveal, stagger: STAGGER.tight }, 1.2)

      /* ================= scroll choreography (desktop) =================
         type parts → light intensifies → core grows into an arch (driven by the
         shared zoom progress in Technology) while the four capabilities are
         annotated around it → the stage hands the core on to Technology. */
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1100px)', () => {
        const st = gsap.timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: SCRUB.type },
        })
        st.to(q('.hero__line--a'), { xPercent: -16, opacity: 0, duration: 0.3 }, 0)
          .to(q('.hero__line--b'), { xPercent: 12, opacity: 0, duration: 0.3 }, 0)
          .to(q('.hero__meta'), { y: -30, opacity: 0, duration: 0.18 }, 0)
          .to(q('.hero__intro'), { y: 60, opacity: 0, duration: 0.22 }, 0)
          .to(q('.hero__spec'), { y: 60, opacity: 0, duration: 0.22 }, 0.02)
          .to(q('.hero__atmos'), { '--lift': 1, duration: 0.5 }, 0.05)
          // capabilities annotate the growing core
          .fromTo(q('.hero__cap'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.16, stagger: 0.05, ease: 'power2.out' }, 0.26)
          .fromTo(q('.hero__cap-lead'), { scaleX: 0 }, { scaleX: 1, duration: 0.16, stagger: 0.05 }, 0.3)
          .to(q('.hero__cap'), { opacity: 0, y: -40, duration: 0.14, stagger: 0.03, ease: 'power2.in' }, 0.84)
      })
      mm.add('(max-width: 1099px)', () => {
        gsap.from(q('.hero__cap'), {
          y: 24,
          opacity: 0,
          duration: DUR.reveal,
          stagger: STAGGER.base,
          scrollTrigger: { trigger: q('.hero__caps')[0], start: 'top 85%' },
        })
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  /* subtle depth: the type plane drifts against the core with the pointer */
  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const el = root.current!
    const xTo = gsap.quickTo(el.querySelector('.hero__title'), 'x', { duration: 1.2, ease: 'power3.out' })
    const yTo = gsap.quickTo(el.querySelector('.hero__title'), 'y', { duration: 1.2, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      xTo(((e.clientX / window.innerWidth) * 2 - 1) * -10)
      yTo(((e.clientY / window.innerHeight) * 2 - 1) * -6)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [reduced])

  return (
    <section ref={root} className={`hero ${webgl ? '' : 'hero--flat'}`} aria-labelledby="hero-title">
      <div className="hero__stage">
        <div className="hero__atmos" aria-hidden="true">
          <span className="hero__key" />
          <span className="hero__blades" />
          <span className="hero__grid" />
        </div>

        <div className="hero__frame v-container">
          <div className="hero__meta">
            <p className="v-label">
              <span className="v-label__idx">01</span>
              <span className="v-label__bar" />
              Intelligence, engineered for business
            </p>
            <span className="v-rule" aria-hidden="true" />
            <p className="v-label hero__meta-r">Agents · Automation · Consulting · Builds</p>
          </div>

          <h1 id="hero-title" className="hero__title v-display">
            <span className="hero__line hero__line--a v-mask"><span>Your Business.</span></span>
            <span className="hero__line hero__line--b v-mask">
              <span>
                <span className="v-metal">Beyond Ordinary</span>
                <span className="hero__stop">.</span>
              </span>
            </span>
          </h1>

          {/* the shared core (fixed canvas, see GlobeLayer) frames itself on this anchor */}
          <div className="hero__core" aria-hidden="true">
            <div ref={anchor} className="globe-anchor hero__core-anchor">
              <GlobeFallback />
            </div>
          </div>

          <div className="hero__intro">
            <p className="hero__sub">
              AI-powered automation, intelligent agents, and digital experiences designed to move your business forward.
            </p>
            <div className="hero__ctas">
              <a className="v-btn v-btn--primary" href="#technology" data-magnetic>
                Explore Solutions
                <span className="v-btn__chip"><IArrow /></span>
              </a>
              <a className="v-btn v-btn--ghost" href="#technology" data-magnetic>
                See How It Works
              </a>
            </div>
          </div>

          <div className="hero__spec">
            <p className="hero__spec-lead">
              <IResearch />
              <span>
                <strong>Research first.</strong> We study your business before recommending anything.
              </span>
            </p>
            <dl>
              {SPEC.map((s) => (
                <div key={s.k} className="hero__spec-row">
                  <dt>{s.k}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ol className="hero__caps" aria-label="What TechtivAI builds">
            {CAPS.map((c, i) => (
              <li key={c.key} className={`hero__cap hero__cap--${c.side} hero__cap--${i + 1}`}>
                <a href="#technology" className="hero__cap-link v-surface">
                  <span className="hero__cap-top">
                    <span className="hero__cap-idx">{String(i + 1).padStart(2, '0')}</span>
                    <c.Icon />
                    <IArrowUpRight className="hero__cap-arr" />
                  </span>
                  <span className="hero__cap-title">{c.title}</span>
                  <span className="hero__cap-text">{c.text}</span>
                </a>
                <span className="hero__cap-lead" aria-hidden="true" />
              </li>
            ))}
          </ol>

        </div>
      </div>
    </section>
  )
}
