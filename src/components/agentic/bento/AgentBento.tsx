import { memo, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { VISUALS } from './Visuals'
import { DEMOS, OPS_NODES } from './bentoData'
import { AGENTS, type Agent, type AgentId } from '../agenticData'
import { IconArrow, IconClose } from '../../Icons'
import './bento.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   Stage 03 bento — owns its own state, so its clock never re-renders the
   Stage 02 network or the reactor above it.

   Animation ownership
   · React state  — which card is active, step, variant, Ops node
   · CSS          — every in-card transition (keyed to step classes)
   · GSAP         — the card surfaces' scroll entrance only
   ========================================================================== */
type Handlers = {
  select: (id: AgentId) => void
  close: () => void
  replay: () => void
  variant: (id: AgentId, v: string) => void
  node: (i: number) => void
  hover: (id: AgentId, on: boolean) => void
}

type CardProps = {
  agent: Agent
  n: number
  live: boolean
  active: boolean
  selected: boolean
  step: number
  variant: string
  node: number
  h: Handlers
}

const AgentCard = memo(function AgentCard({ agent, n, live, active, selected, step, variant, node, h }: CardProps) {
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

  // pointer light + parallax: written straight to CSS variables, no React render
  const raf = useRef(0)
  const onMove = (e: React.PointerEvent) => {
    if (!live || e.pointerType !== 'mouse') return
    const { clientX, clientY } = e
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = (clientX - r.left) / r.width
      const y = (clientY - r.top) / r.height
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      el.style.setProperty('--px', (x * 2 - 1).toFixed(3))
      el.style.setProperty('--py', (y * 2 - 1).toFixed(3))
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(raf.current)
    h.hover(agent.id, false)
    ref.current!.style.setProperty('--px', '0')
    ref.current!.style.setProperty('--py', '0')
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const Visual = VISUALS[agent.id]
  const chip = !active ? 'Standby' : done ? 'Complete' : step === 0 ? 'Starting' : `Step ${step} of ${N}`
  const now = step === 0 ? 'Starting demo…' : labels[Math.min(step, N) - 1]
  const opsNode = agent.id === 'opsbot' && node >= 0 ? OPS_NODES[node] : null

  return (
    <article
      ref={ref}
      className={`agb agb--${agent.id} agb--${agent.span} ${active ? 'is-active' : ''} ${selected ? 'is-selected' : ''} ${active && done ? 'is-done' : ''} ${compact ? 'is-compact' : ''}`}
      onPointerMove={onMove}
      onPointerEnter={(e) => e.pointerType === 'mouse' && h.hover(agent.id, true)}
      onPointerLeave={onLeave}
      data-card={agent.id}
    >
      <button
        ref={hitRef}
        type="button"
        className="agb__hit"
        data-cursor="surface"
        aria-expanded={selected}
        aria-controls={id}
        onClick={() => (selected ? h.close() : h.select(agent.id))}
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
        <Visual step={step} N={N} variant={variant} selected={selected} compact={compact} node={node} onNode={h.node} />
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
                    <button key={v.id} type="button" aria-pressed={variant === v.id} className={variant === v.id ? 'is-on' : ''} onClick={() => h.variant(agent.id, v.id)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="agb__sp" />
              <button ref={replayRef} type="button" className="agb__btn" onClick={h.replay}>
                <IconReplay /> <span className="agb__btn-l">Replay</span>
              </button>
              <button type="button" className="agb__btn agb__btn--x" onClick={h.close} aria-label={`Close the ${agent.name} demo`}>
                <IconClose />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
})

const IconReplay = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.8" />
    <path d="M2.6 2.4v2.9h2.9" />
  </svg>
)

const lastStep = (id: AgentId, v: string) => DEMOS[id].steps(v).length

export default function AgentBento({ live }: { live: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<AgentId | null>(null)
  const [hover, setHover] = useState<AgentId | null>(null)
  const [spot, setSpot] = useState(0)
  const [gridIn, setGridIn] = useState(false)
  const [run, setRun] = useState(0)
  const [step, setStep] = useState(0)
  const [node, setNode] = useState(-1)
  // cards "power on" as they enter: un-booted cards rest at step 0
  const [booted, setBooted] = useState<Set<AgentId>>(() => new Set(live ? [] : AGENTS.map((a) => a.id)))
  const [variants, setVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries(AGENTS.map((a) => [a.id, DEMOS[a.id].variants?.[0].id ?? ''])),
  )

  useEffect(() => {
    const el = grid.current!
    const io = new IntersectionObserver(([e]) => setGridIn(e.isIntersecting), { threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!live) setBooted(new Set(AGENTS.map((a) => a.id)))
  }, [live])

  // which card demonstrates: selection › deliberate hover › auto spotlight (once the grid has booted)
  const allBooted = booted.size === AGENTS.length
  const active: AgentId | null = selected ?? (live && gridIn && allBooted ? (hover ?? AGENTS[spot].id) : null)
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

  const hoverT = useRef(0)
  useEffect(() => () => window.clearTimeout(hoverT.current), [])

  // stable handlers → memoised cards only re-render when their own props change
  const h = useRef<Handlers>({
    select: (id) => {
      setNode(-1)
      setSelected(id)
      setRun((r) => r + 1)
    },
    close: () => {
      setSelected(null)
      setNode(-1)
    },
    replay: () => setRun((r) => r + 1),
    variant: (id, v) => setVariants((m) => (m[id] === v ? m : { ...m, [id]: v })),
    node: (i) => setNode(i),
    hover: (id, on) => {
      window.clearTimeout(hoverT.current)
      if (on) hoverT.current = window.setTimeout(() => setHover(id), 450)
      else setHover((x) => (x === id ? null : x))
    },
  }).current

  const onKey = useCallback((e: KeyboardEvent) => e.key === 'Escape' && h.close(), [h])
  useEffect(() => {
    if (!selected) return
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, onKey])

  /* Chapter 03 entrance — label + bridge, then each surface lifts in and its
     own interface powers on (step 0 → rest frame), so every card arrives
     with its own motion: the ring lights, the chart draws, the scanner runs… */
  useGSAP(
    () => {
      if (!live) return
      const q = gsap.utils.selector(root)
      gsap.from(q('.ag-bridge__k, .ag-bridge__n'), {
        y: 12,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: q('.ag-bridge')[0], start: 'top 80%', once: true },
      })
      const cards = q('[data-card]')
      gsap.set(cards, { y: 36, opacity: 0 })
      // GSAP owns the surface while it enters; CSS hover transitions wait
      cards.forEach((c) => c.setAttribute('data-enter', ''))
      ScrollTrigger.batch(cards, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            onComplete: () => batch.forEach((el) => el.removeAttribute('data-enter')),
          })
          batch.forEach((el, i) => {
            const id = (el as HTMLElement).dataset.card as AgentId
            gsap.delayedCall(0.28 + i * 0.1, () => setBooted((b) => (b.has(id) ? b : new Set(b).add(id))))
          })
        },
      })
    },
    { scope: root, dependencies: [live] },
  )

  return (
    <div ref={root} className="ag-bento">
      <div className="ag-bento__light" aria-hidden="true" />
      <div className="ag-bridge" aria-hidden="true">
        <span className="ag-bridge__line" />
      </div>
      <div className="ag__sub">
        <p className="ag-bridge__k">The agents</p>
        <p className="ag-bridge__n" aria-hidden="true">
          07
        </p>
      </div>
      <div ref={grid} className={`ag-grid ${selected ? 'has-selection' : ''} ${gridIn ? '' : 'is-out'}`}>
        {AGENTS.map((a, i) => {
          const isActive = active === a.id
          const v = variants[a.id]
          return (
            <AgentCard
              key={a.id}
              agent={a}
              n={i + 1}
              live={live}
              active={isActive}
              selected={selected === a.id}
              step={isActive ? step : booted.has(a.id) ? lastStep(a.id, v) : 0}
              variant={v}
              node={selected === a.id ? node : -1}
              h={h}
            />
          )
        })}
      </div>
      <p className="ag__note">
        Interactive demonstrations · scripted sample data · no live agents, data or systems connected. Agent suggestions are reviewed by a person before anything is sent.
      </p>
    </div>
  )
}
