import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { SculptureAI, SculptureBusiness, SculptureDefs, SculptureMarketing, SculptureSystems } from './Sculptures'
import { IconArrow, IconClose } from '../Icons'
import { PREVIEW_MODE, useReducedMotion } from '../../lib/env'
import '../glass.css'
import './assessment.css'
import Cta from '../Cta'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* The live CTA links to /analyze (a research flow backed by the production
   app). This standalone preview has no backend, so it opens the live flow. */
const ASSESS_URL = PREVIEW_MODE ? 'https://techtivai.vercel.app/analyze' : '/analyze'

type Stage = {
  id: string
  n: string
  title: string
  desc: string
  Art: (p: { animate: boolean }) => React.ReactNode
  looks: string[]
  outcome: string
}

/* Titles and descriptions: live TechtivAI section. Detail lines restate the
   same scope in more words; they describe the process, not results. */
const STAGES: Stage[] = [
  {
    id: 'business',
    n: '01',
    title: 'Business & Industry',
    desc: 'We research your company, market, and how you operate today.',
    Art: SculptureBusiness,
    looks: ['Your company, offer and customers', 'Your market and competitors', 'How work gets done today'],
    outcome: 'A clear picture of how the business runs before anything is recommended.',
  },
  {
    id: 'problems',
    n: '02',
    title: 'Problems & Tools',
    desc: 'We map bottlenecks, existing software, and your technology stack.',
    Art: SculptureSystems,
    looks: ['Bottlenecks and repetitive work', 'The software you already use', 'Gaps and manual steps between systems'],
    outcome: 'A map of where time and data get stuck.',
  },
  {
    id: 'marketing',
    n: '03',
    title: 'Marketing & Social',
    desc: 'We review web, social, and digital presence for growth gaps.',
    Art: SculptureMarketing,
    looks: ['Your website and conversion path', 'Social profiles and content', 'Overall digital presence'],
    outcome: 'The growth gaps worth fixing first.',
  },
  {
    id: 'opportunities',
    n: '04',
    title: 'AI & Automation Opportunities',
    desc: 'We recommend agents, automation, chatbots, web/app, and ML where they fit.',
    Art: SculptureAI,
    looks: ['AI agents and chatbots', 'Workflow automation', 'Web/app and ML — only where they fit'],
    outcome: 'Recommendations collected in your AI Blueprint.',
  },
]

function StageCard({ stage, selected, onToggle, onClose, animate }: { stage: Stage; selected: boolean; onToggle: () => void; onClose: () => void; animate: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const hitRef = useRef<HTMLButtonElement>(null)
  const wasSelected = useRef(false)

  // focus follows the state change so keyboard users never lose their place
  useEffect(() => {
    if (selected) closeRef.current?.focus({ preventScroll: true })
    else if (wasSelected.current && ref.current?.contains(document.activeElement)) hitRef.current?.focus({ preventScroll: true })
    wasSelected.current = selected
  }, [selected])

  // pointer depth: the tile leans toward the cursor; the border light follows it
  const onMove = (e: React.PointerEvent) => {
    if (!animate || e.pointerType !== 'mouse') return
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    el.style.setProperty('--tx', (px - 0.5).toFixed(3))
    el.style.setProperty('--ty', (py - 0.5).toFixed(3))
  }
  const onLeave = () => {
    ref.current?.style.setProperty('--tx', '0')
    ref.current?.style.setProperty('--ty', '0')
  }

  const detailId = `as-detail-${stage.id}`
  const { Art } = stage
  return (
    <article ref={ref} className={`af af--${stage.id} ${selected ? 'is-selected' : ''}`} onPointerMove={onMove} onPointerLeave={onLeave} data-reveal>
      <button ref={hitRef} type="button" className="af__hit" aria-expanded={selected} aria-controls={detailId} onClick={onToggle}>
        <span className="sr-only">{selected ? `Hide details for ${stage.title}` : `Show details for stage ${stage.n}: ${stage.title}`}</span>
      </button>

      <div className="af__float" aria-hidden="true">
        <span className="af__pool" />
        <div className="af__tile">
          <span className="af__sheen" />
          <span className="af__art">
            <Art animate={animate} />
          </span>
        </div>
      </div>

      <div className="af__card">
        <div className="af__stack">
          <div className="af__face af__face--summary" aria-hidden={selected}>
            <span className="af__n">{stage.n}</span>
            <h3 className="af__title">{stage.title}</h3>
            <p className="af__desc">{stage.desc}</p>
            <span className="af__more">
              Details <IconArrow />
            </span>
          </div>
          <div id={detailId} className="af__face af__face--detail" role="region" aria-label={`${stage.title} details`} aria-hidden={!selected} inert={!selected}>
            <span className="af__n">{stage.n} · What we look at</span>
            <ul className="af__looks">
              {stage.looks.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="af__out">
              <span>You get</span> {stage.outcome}
            </p>
          </div>
        </div>
      </div>
      <button ref={closeRef} type="button" className="af__close" onClick={onClose} aria-label={`Close ${stage.title} details`} tabIndex={selected ? 0 : -1} aria-hidden={!selected}>
        <IconClose />
      </button>
    </article>
  )
}

export default function Assessment() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState<string | null>(null)

  const close = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, close])

  // idle motion (CSS float + SMIL inside the sculptures) rests off-screen
  useEffect(() => {
    const el = root.current!
    const io = new IntersectionObserver(([e]) => {
      el.classList.toggle('is-offscreen', !e.isIntersecting)
      el.querySelectorAll<SVGSVGElement>('svg.sc').forEach((s) => (e.isIntersecting ? s.unpauseAnimations() : s.pauseAnimations()))
    })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      if (reduced) {
        root.current!.classList.add('is-lit')
        return
      }
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%' }, defaults: { ease: 'power3.out' } })
      tl.from(q('.as__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.as__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.as__sub'), { y: 16, opacity: 0, duration: 0.8 }, 0.45)

      // cards, then their sculptures float up into place; the light comes on last
      const cards = q('.af__card')
      const tiles = q('.af__tile')
      const pools = q('.af__pool')
      gsap.set(cards, { y: 34, opacity: 0 })
      gsap.set(tiles, { y: 26, scale: 0.86, opacity: 0 })
      gsap.set(pools, { opacity: 0 })
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io.disconnect()
          const r = gsap.timeline({ defaults: { ease: 'power3.out' } })
          r.to(cards, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, clearProps: 'transform,opacity' })
            .to(tiles, { y: 0, scale: 1, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.18)
            .to(pools, { opacity: 1, duration: 0.8, stagger: 0.12, clearProps: 'opacity' }, 0.6)
            .call(() => root.current?.classList.add('is-lit'), undefined, 0.5)
        },
        { threshold: 0.15 },
      )
      io.observe(q('.as__grid')[0])
      gsap.from(q('.as__cta'), { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: q('.as__cta')[0], start: 'top 92%' } })
      return () => io.disconnect()
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section ref={root} id="ai-assessment" className={`as ${selected ? 'has-selection' : ''}`} aria-labelledby="as-title">
      <SculptureDefs />
      <header className="as__head">
        <p className="as__eyebrow">
          <span className="as__eyebrow-dot" aria-hidden="true" />
          AI Business Assessment
        </p>
        <h2 id="as-title" className="as__title">
          <span className="as__line">
            <span>We research your business</span>
          </span>
          <span className="as__line as__line--accent">
            <span>before we recommend anything.</span>
          </span>
        </h2>
        <p className="as__sub">From industry and operations to tools, marketing, and social — then we surface automation and AI opportunities that actually fit.</p>
      </header>

      <div className="as__grid">
        {STAGES.map((s) => (
          <StageCard
            key={s.id}
            stage={s}
            animate={!reduced}
            selected={selected === s.id}
            onToggle={() => setSelected((cur) => (cur === s.id ? null : s.id))}
            onClose={close}
          />
        ))}
      </div>

      <div className="as__cta">
        <Cta href={ASSESS_URL} target={PREVIEW_MODE ? '_blank' : undefined} rel={PREVIEW_MODE ? 'noopener' : undefined} data-magnetic>
          Start My Assessment <IconArrow />
        </Cta>
        <p className="as__note">
          Select a stage to see what it covers.
          {PREVIEW_MODE && ' The button opens the live TechtivAI assessment in a new tab.'}
        </p>
      </div>
    </section>
  )
}
