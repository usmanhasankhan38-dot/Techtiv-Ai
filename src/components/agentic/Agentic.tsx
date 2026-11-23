import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import AgentForce from './AgentForce'
import { VISUALS } from './bento/Visuals'
import { DEMOS, OPS_NODES } from './bento/bentoData'
import { AGENTS, COPY, type Agent, type AgentId } from './agenticData'
import { IconArrow, IconClose } from '../Icons'
import { PREVIEW_MODE, useReducedMotion } from '../../lib/env'
import './agentic.css'
import './bento/bento.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Live CTA → /analyze. This standalone preview opens the live flow. */
const CTA_URL = PREVIEW_MODE ? 'https://techtivai.vercel.app/analyze' : '/analyze'

/* ==========================================================================
   Stage 03 — bento card
   States: idle (rest frame) → hovered → selected → demonstrating → complete.
   The visual is a pure function of (step, variant); the section owns the
   single timer, so only one card is ever demonstrating.
   ========================================================================== */
type CardProps = {
  agent: Agent
  n: number
  live: boolean
  active: boolean
  selected: boolean
  step: number
  variant: string
  node: number
  onSelect: () => void
  onClose: () => void
  onReplay: () => void
  onVariant: (v: string) => void
  onNode: (i: number) => void
  onHover: (on: boolean) => void
}

function AgentCard({ agent, n, live, active, selected, step, variant, node, onSelect, onClose, onReplay, onVariant, onNode, onHover }: CardProps) {
  const ref = useRef<HTMLElement>(null)
  const hitRef = useRef<HTMLButtonElement>(null)
  const replayRef = useRef<HTMLButtonElement>(null)
  const was = useRef(false)
  const [compact, setCompact] = useState(false)
  const demo = DEMOS[agent.id]
  const labels = demo.steps(variant)
  const N = labels.length
  const done = step >= N
  const id = `agb-demo-${agent.id}`

  useEffect(() => {
    if (selected) replayRef.current?.focus({ preventScroll: true })
    else if (was.current && ref.current?.contains(document.activeElement)) hitRef.current?.focus({ preventScroll: true })
    was.current = selected
  }, [selected])

  // wide cards re-compose (not shrink) when they get narrow
  useEffect(() => {
    if (agent.span !== 'two') return
    const el = ref.current!
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < 600))
    ro.observe(el)
    return () => ro.disconnect()
  }, [agent.span])

  const onMove = (e: React.PointerEvent) => {
    if (!live || e.pointerType !== 'mouse') return
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
    el.style.setProperty('--px', (x * 2 - 1).toFixed(3))
    el.style.setProperty('--py', (y * 2 - 1).toFixed(3))
  }
  const onLeave = () => {
    onHover(false)
    ref.current!.style.setProperty('--px', '0')
    ref.current!.style.setProperty('--py', '0')
  }

  const Visual = VISUALS[agent.id]
  const chip = !active ? 'Standby' : done ? 'Complete' : step === 0 ? 'Starting' : `Step ${step} of ${N}`
  const now = step === 0 ? 'Starting demo…' : labels[Math.min(step, N) - 1]
  const opsNode = agent.id === 'opsbot' && node >= 0 ? OPS_NODES[node] : null

  return (
    <article
      ref={ref}
      className={`agb agb--${agent.id} agb--${agent.span} ${active ? 'is-active' : ''} ${selected ? 'is-selected' : ''} ${active && done ? 'is-done' : ''} ${compact ? 'is-compact' : ''}`}
      onPointerMove={onMove}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(true)}
      onPointerLeave={onLeave}
      data-card
    >
      <button
        ref={hitRef}
        type="button"
        className="agb__hit"
        aria-expanded={selected}
        aria-controls={id}
        onClick={() => (selected ? onClose() : onSelect())}
      >
        <span className="sr-only">{selected ? `Close the ${agent.name} demo` : `Open the ${agent.name} demo — ${agent.role}`}</span>
      </button>

      <div className="agb__top" aria-hidden="true">
        <span className="agb__n">
          <i /> {String(n).padStart(2, '0')}
        </span>
        <span className="agb__chip">
          <i /> {chip}
        </span>
      </div>

      <div className="agb__visual">
        <span className="agb__beam" aria-hidden="true" />
        <Visual step={active ? step : N} N={N} variant={variant} selected={selected} compact={compact} node={node} onNode={onNode} />
      </div>

      <div className="agb__text">
        <h3>
          {agent.name} <span>— {agent.role}</span>
        </h3>
        <div className="agb__swap">
          <div className="agb__rest" aria-hidden={selected}>
            <p>{agent.desc}</p>
            <span className="agb__cue" aria-hidden="true">
              Explore demo <IconArrow />
            </span>
          </div>
          <div id={id} className="agb__demo" role="region" aria-label={`${agent.name} demo controls`} aria-hidden={!selected} inert={!selected}>
            <div className="agb__now">
              <p aria-live="polite">{done ? labels[N - 1] : now}</p>
              <ol className="agb__dots" aria-hidden="true">
                {labels.map((l, i) => (
                  <li key={l} className={i < step ? 'is-on' : ''} />
                ))}
              </ol>
            </div>
            {agent.id === 'opsbot' && (
              <p className="agb__node">
                {opsNode ? (
                  <>
                    <b>{opsNode.t}</b> — {opsNode.d}
                  </>
                ) : (
                  'Select a step in the pipeline to inspect it.'
                )}
              </p>
            )}
            <div className="agb__ctl">
              {demo.variants && (
                <div className="agb__seg" role="group" aria-label="Demo scenario">
                  {demo.variants.map((v) => (
                    <button key={v.id} type="button" aria-pressed={variant === v.id} className={variant === v.id ? 'is-on' : ''} onClick={() => onVariant(v.id)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="agb__sp" />
              <button ref={replayRef} type="button" className="agb__btn" onClick={onReplay}>
                <IconReplay /> <span className="agb__btn-l">Replay</span>
              </button>
              <button type="button" className="agb__btn agb__btn--x" onClick={onClose} aria-label={`Close the ${agent.name} demo`}>
                <IconClose />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

const IconReplay = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.8" />
    <path d="M2.6 2.4v2.9h2.9" />
  </svg>
)

export default function Agentic() {
  const root = useRef<HTMLElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  const [selected, setSelected] = useState<AgentId | null>(null)
  const [hover, setHover] = useState<AgentId | null>(null)
  const [spot, setSpot] = useState(0)
  const [gridIn, setGridIn] = useState(false)
  const [run, setRun] = useState(0)
  const [step, setStep] = useState(0)
  const [node, setNode] = useState(-1)
  const [variants, setVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries(AGENTS.map((a) => [a.id, DEMOS[a.id].variants?.[0].id ?? ''])),
  )

  useEffect(() => {
    const el = grid.current!
    const io = new IntersectionObserver(([e]) => setGridIn(e.isIntersecting), { threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // which card is demonstrating: selection › deliberate hover › auto spotlight
  const active: AgentId | null = selected ?? (live && gridIn ? (hover ?? AGENTS[spot].id) : null)
  const activeVariant = active ? variants[active] : ''
  const auto = !selected && !hover

  // the single demo clock
  useEffect(() => {
    if (!active) return
    const d = DEMOS[active]
    const N = d.steps(activeVariant).length
    if (!live) {
      setStep(N)
      return
    }
    if (!gridIn) return
    let s = 0
    setStep(0)
    let t = window.setTimeout(function tick() {
      s += 1
      setStep(s)
      if (s < N) t = window.setTimeout(tick, d.ms)
      else if (auto) t = window.setTimeout(() => setSpot((i) => (i + 1) % AGENTS.length), 2600)
    }, 420)
    return () => window.clearTimeout(t)
  }, [active, activeVariant, run, live, gridIn, auto])

  // hover becomes "the" demo only after a deliberate dwell
  const hoverT = useRef(0)
  const onHover = (id: AgentId, on: boolean) => {
    window.clearTimeout(hoverT.current)
    if (on) hoverT.current = window.setTimeout(() => setHover(id), 450)
    else setHover((h) => (h === id ? null : h))
  }
  useEffect(() => () => window.clearTimeout(hoverT.current), [])

  const select = (id: AgentId) => {
    setNode(-1)
    setSelected(id)
    setRun((r) => r + 1)
  }
  const close = () => {
    setSelected(null)
    setNode(-1)
  }

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])

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
      const cards = q('[data-card]')
      gsap.set(cards, { y: 40, opacity: 0 })
      ScrollTrigger.batch(cards, {
        start: 'top 88%',
        once: true,
        onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity' }),
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section ref={root} id="agentic-solutions" className="ag" aria-labelledby="ag-title">
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
        <a className="btn btn--primary" href={CTA_URL} target={PREVIEW_MODE ? '_blank' : undefined} rel={PREVIEW_MODE ? 'noopener' : undefined} data-magnetic>
          {COPY.cta} <IconArrow />
        </a>
      </div>

      {/* Part B — the seven agents */}
      <div className="ag__sub">
        <p className="ag__feat-k">The agents</p>
      </div>
      <div ref={grid} className={`ag-grid ${selected ? 'has-selection' : ''} ${gridIn ? '' : 'is-out'}`}>
        {AGENTS.map((a, i) => (
          <AgentCard
            key={a.id}
            agent={a}
            n={i + 1}
            live={live}
            active={active === a.id}
            selected={selected === a.id}
            step={active === a.id ? step : DEMOS[a.id].steps(variants[a.id]).length}
            variant={variants[a.id]}
            node={selected === a.id ? node : -1}
            onSelect={() => select(a.id)}
            onClose={close}
            onReplay={() => setRun((r) => r + 1)}
            onVariant={(v) => setVariants((m) => ({ ...m, [a.id]: v }))}
            onNode={setNode}
            onHover={(on) => onHover(a.id, on)}
          />
        ))}
      </div>
      <p className="ag__note">Interactive demonstrations · scripted sample data · no live agents, data or systems connected. Agent suggestions are reviewed by a person before anything is sent.</p>
    </section>
  )
}
