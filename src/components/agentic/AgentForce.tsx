import { memo, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import gsap from 'gsap'
import Reactor from './reactor/Reactor'
import AgentIcon from './agentforce/AgentIcons'
import MicroVis, { type Phase } from './agentforce/MicroVis'
import { DEMO_REQUEST, MODULES, REVIEW_STEP } from './agenticData'
import { Glyph } from '../glyphs'
import './agentforce/agentforce.css'

/* ==========================================================================
   Stage 02 — Living Agent Network
   ONE state machine drives everything: console states, connection
   illumination, signal movement, reactor focus/pulse, status text, task
   progress and controls. Each sequence carries a `run` id; a new selection
   bumps the id, so any pending step of the previous sequence is ignored.
   The reactor's idle rotation is never touched — it only receives focus and
   a pulse.
   ========================================================================== */

type Stage = 'idle' | 'selected' | 'processing' | 'complete' | 'review'
type Mode = 'auto' | 'manual'
type M = { mode: Mode; stage: Stage; agent: number; step: number; run: number }
type A = { t: 'start'; agent: number; mode: Mode } | { t: 'advance'; run: number } | { t: 'resume' } | { t: 'instant'; agent: number }

const DUR: Record<Stage, number> = { idle: 1400, selected: 750, processing: 1000, complete: 1300, review: 3000 }

function reduce(m: M, a: A): M {
  switch (a.t) {
    case 'start':
      return { mode: a.mode, stage: 'selected', agent: a.agent, step: 0, run: m.run + 1 }
    case 'instant': // reduced motion: show the finished task without the sequence
      return { mode: 'manual', stage: 'complete', agent: a.agent, step: 2, run: m.run + 1 }
    case 'resume':
      return { mode: 'auto', stage: 'idle', agent: -1, step: 0, run: m.run + 1 }
    case 'advance': {
      if (a.run !== m.run) return m // stale step from a cancelled sequence
      if (m.stage === 'selected') return { ...m, stage: 'processing', step: 0 }
      if (m.stage === 'processing') return m.step < 2 ? { ...m, step: m.step + 1 } : { ...m, stage: 'complete' }
      if (m.stage === 'complete' && m.mode === 'auto')
        return m.agent < MODULES.length - 1 ? { ...m, stage: 'selected', agent: m.agent + 1, step: 0, run: m.run + 1 } : { ...m, stage: 'review', run: m.run + 1 }
      if (m.stage === 'review') return { ...m, stage: 'idle', agent: -1, run: m.run + 1 }
      if (m.stage === 'idle' && m.mode === 'auto') return { ...m, stage: 'selected', agent: 0, step: 0, run: m.run + 1 }
      return m
    }
  }
}

type Path = { d: string; ok: boolean }

function AgentForce({ live }: { live: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [m, dispatch] = useReducer(reduce, { mode: 'auto', stage: 'idle', agent: -1, step: 0, run: 0 })
  const [hover, setHover] = useState(-1)
  const [inView, setInView] = useState(false)
  const [drawn, setDrawn] = useState(!live)
  const [geo, setGeo] = useState<{ w: number; h: number; paths: Path[] } | null>(null)
  const mRef = useRef(m)
  mRef.current = m
  const stageT0 = useRef(performance.now())

  // the stage clock restarts whenever the machine moves
  useLayoutEffect(() => {
    stageT0.current = performance.now()
  }, [m.run, m.stage, m.step])

  /* ---------------- the only timer in the network ---------------- */
  useEffect(() => {
    if (!live || !inView) return
    if (m.mode === 'manual' && (m.stage === 'complete' || m.stage === 'idle')) return
    const id = window.setTimeout(() => dispatch({ t: 'advance', run: m.run }), DUR[m.stage])
    return () => window.clearTimeout(id)
  }, [m.run, m.stage, m.step, m.mode, inView, live])

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(stage.current!)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!inView || drawn) return
    // connections draw out of the reactor as the consoles land (Chapter 01)
    const id = window.setTimeout(() => setDrawn(true), 900)
    return () => window.clearTimeout(id)
  }, [inView, drawn])

  const select = useCallback(
    (i: number) => {
      if (!live) return dispatch({ t: 'instant', agent: i })
      dispatch({ t: 'start', agent: i, mode: 'manual' })
    },
    [live],
  )
  useEffect(() => {
    if (m.mode !== 'manual') return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch({ t: 'resume' })
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [m.mode])

  /* ---------------- geometry: reactor rim → console port ---------------- */
  const shown = m.agent >= 0 ? m.agent : 0
  useLayoutEffect(() => {
    const el = stage.current!
    const measure = () => {
      const box = el.getBoundingClientRect()
      const core = el.querySelector<HTMLElement>('.af-core')!.getBoundingClientRect()
      const cx = core.left - box.left + core.width / 2
      const cy = core.top - box.top + core.height / 2
      const R = core.width * 0.38 // V3: rim of the geodesic core's outer cage (camera fit in GeodesicCore)
      const paths = MODULES.map((mod) => {
        const card = el.querySelector<HTMLElement>(`[data-mod="${mod.id}"]`)!
        const port = card.querySelector<HTMLElement>('.afc__port')!
        const cr = card.getBoundingClientRect()
        const pr = port.getBoundingClientRect()
        if (!cr.width) return { d: '', ok: false }
        const px = pr.left - box.left + pr.width / 2
        const py = pr.top - box.top + pr.height / 2
        // port normal: out of the console, toward the reactor
        const top = Math.abs(pr.top + pr.height / 2 - cr.top) < 6
        const nx = top ? 0 : pr.left + pr.width / 2 >= cr.right - 6 ? 1 : -1
        const ny = top ? -1 : 0
        const dx = px - cx
        const dy = py - cy
        const L = Math.hypot(dx, dy) || 1
        const sx = cx + (dx / L) * R
        const sy = cy + (dy / L) * R
        const k = Math.hypot(px - sx, py - sy) * 0.42
        const c1x = sx + (dx / L) * k
        const c1y = sy + (dy / L) * k
        // side ports approach horizontally, but never further than the reactor's centre line
        const k2 = top ? k : Math.min(k, Math.abs(px - cx) * 0.85)
        const c2x = px + nx * k2
        const c2y = py + ny * k2
        const f = (n: number) => n.toFixed(1)
        return { d: `M${f(sx)},${f(sy)} C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(px)},${f(py)}`, ok: true }
      })
      setGeo({ w: box.width, h: box.height, paths })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // the entrance moves the consoles with transforms; re-anchor once they settle
    const t1 = window.setTimeout(measure, 1700)
    const t2 = window.setTimeout(measure, 3200)
    return () => {
      ro.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [shown, drawn])

  /* ---------------- signals follow the real paths (time-based) ---------------- */
  useEffect(() => {
    if (!live || !inView || !geo) return
    const svg = svgRef.current!
    const paths = MODULES.map((_, i) => svg.querySelector<SVGPathElement>(`[data-path="${i}"]`))
    const lens = paths.map((p) => (p ? p.getTotalLength() : 0))
    const idle = MODULES.map((_, i) => svg.querySelector<SVGCircleElement>(`[data-idle="${i}"]`))
    const comet = [...svg.querySelectorAll<SVGCircleElement>('[data-comet]')]
    const packets = [...svg.querySelectorAll<SVGCircleElement>('[data-packet]')]
    const put = (c: SVGCircleElement | null, i: number, u: number, o: number) => {
      const p = paths[i]
      if (!c) return
      if (!p || !lens[i] || o <= 0.01) return c.setAttribute('opacity', '0')
      const pt = p.getPointAtLength(Math.max(0, Math.min(1, u)) * lens[i])
      c.setAttribute('cx', pt.x.toFixed(1))
      c.setAttribute('cy', pt.y.toFixed(1))
      c.setAttribute('opacity', o.toFixed(2))
    }
    const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
    const tick = () => {
      const now = performance.now()
      const t = now / 1000
      const s = mRef.current
      const k = Math.min(1, (now - stageT0.current) / DUR[s.stage])
      const busy = s.mode === 'manual' && s.stage !== 'idle'
      // idle trickle: one faint dot per path, console → reactor; quiet during interaction
      idle.forEach((c, i) => {
        const u = 1 - ((t * 0.12 + i * 0.27) % 1)
        const o = (busy && i !== s.agent ? 0.08 : 0.32) * Math.sin(u * Math.PI)
        put(c, i, u, o)
      })
      // transmission comet: reactor → console on select, console → reactor on complete
      let ci = -1
      let cu = 0
      let dir = 1
      if (s.stage === 'selected' && s.agent >= 0) {
        ci = s.agent
        cu = ease(k)
      } else if (s.stage === 'complete' && s.agent >= 0 && k < 0.6) {
        ci = s.agent
        cu = 1 - ease(k / 0.6)
        dir = -1
      }
      comet.forEach((c, n) => put(c, ci < 0 ? 0 : ci, cu - n * 0.035 * dir, ci < 0 ? 0 : (1 - n * 0.17) * (dir > 0 ? 1 : 0.9)))
      // processing: small data packets exchange in both directions on the active path
      packets.forEach((c, n) => {
        if (s.stage !== 'processing' || s.agent < 0) return c.setAttribute('opacity', '0')
        const v = (t * 0.55 + n / packets.length) % 1
        const u = n % 2 ? v : 1 - v
        put(c, s.agent, u, 0.85 * Math.sin(v * Math.PI))
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [live, inView, geo])

  /* ---------------- derived view state ---------------- */
  const phaseOf = (i: number): Phase => {
    if (m.stage === 'review') return 'complete'
    if (i === m.agent) return m.stage === 'selected' ? 'selected' : m.stage === 'processing' ? 'processing' : m.stage === 'complete' ? 'complete' : 'idle'
    if (m.mode === 'auto' && m.agent > i) return 'complete'
    if (i === hover) return 'preview'
    return 'idle'
  }
  const focus = m.stage === 'processing' ? 0.9 : m.stage === 'selected' ? 0.8 : m.stage === 'complete' ? 0.62 : m.stage === 'review' ? 0.55 : hover >= 0 ? 0.5 : 0.35
  const pulseKey = m.stage === 'selected' ? m.run : 0
  const active = m.agent >= 0 ? MODULES[m.agent] : null
  const status = (i: number) => {
    const p = phaseOf(i)
    if (p === 'selected') return 'Receiving'
    if (p === 'processing') return `Step ${m.step + 1} of 3`
    if (p === 'complete') return 'Complete'
    return 'Ready'
  }
  const liveText = active
    ? m.stage === 'selected'
      ? `${active.name} selected.`
      : m.stage === 'processing'
        ? `${active.name}: ${active.steps[m.step]}, step ${m.step + 1} of 3.`
        : m.stage === 'complete'
          ? `${active.name}: ${active.result}.`
          : ''
    : m.stage === 'review'
      ? REVIEW_STEP
      : ''

  const renderConsole = (i: number) => {
    const mod = MODULES[i]
    const ph = phaseOf(i)
    const isActive = m.agent === i && m.stage !== 'idle' && m.stage !== 'review'
    const dim = m.mode === 'manual' && m.agent >= 0 && !isActive && ph !== 'preview'
    return (
      <button
        key={mod.id}
        type="button"
        data-mod={mod.id}
        data-cursor="surface"
        className={`afc afc--${mod.id} afc--${mod.side} is-${ph} ${isActive ? 'is-current' : ''} ${dim ? 'is-dim' : ''} ${shown === i ? 'is-shown' : ''}`}
        aria-pressed={m.mode === 'manual' && m.agent === i}
        aria-label={`${mod.name}: ${mod.desc}. Run the demo task.`}
        onClick={() => select(i)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
        onPointerLeave={() => setHover(-1)}
        onFocus={() => setHover(i)}
        onBlur={() => setHover(-1)}
      >
        <span className="afc__sheen" aria-hidden="true" />
        <span className="afc__head">
          <span className="afc__icon">
            <AgentIcon id={mod.id} />
          </span>
          <span className="afc__title">
            <em>{mod.n}</em>
            <b>{mod.name}</b>
          </span>
          <span className="afc__state">
            <i /> {status(i)}
          </span>
        </span>
        <span className="afc__desc">{mod.desc}</span>
        <span className="afc__vis">
          <MicroVis id={mod.id} phase={ph} step={m.agent === i ? m.step : 0} />
        </span>
        <span className="afc__task" aria-hidden="true">
          {mod.steps.map((s, k) => {
            const st = ph === 'complete' ? 'done' : ph === 'processing' ? (k < m.step ? 'done' : k === m.step ? 'now' : 'next') : 'next'
            return <i key={s} className={`is-${st}`} />
          })}
          <span className="afc__task-t">{ph === 'processing' ? mod.steps[m.step] : ph === 'complete' ? mod.result : ph === 'selected' ? 'Task received' : 'Select to run demo task'}</span>
        </span>
        <span className="afc__port" aria-hidden="true" />
      </button>
    )
  }

  const lit = (i: number) => m.agent === i && m.stage !== 'idle' && m.stage !== 'review'
  return (
    <div className={`af ${drawn ? 'is-drawn' : ''} af--${m.mode}`}>
      {/* mobile: compact selector instead of the full network */}
      <div className="af-picker" role="group" aria-label="Choose an agent">
        {MODULES.map((mod, i) => (
          <button key={mod.id} type="button" className={`af-pick ${shown === i ? 'is-on' : ''}`} aria-pressed={m.agent === i && m.mode === 'manual'} onClick={() => select(i)}>
            <AgentIcon id={mod.id} />
            <span>{mod.name.replace(' Agent', '')}</span>
          </button>
        ))}
      </div>

      <div ref={stage} className="af-stage">
        <svg ref={svgRef} className="afn" width={geo?.w ?? 0} height={geo?.h ?? 0} viewBox={`0 0 ${geo?.w ?? 1} ${geo?.h ?? 1}`} aria-hidden="true">
          <defs>
            <linearGradient id="af-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3de8ff" />
              <stop offset="1" stopColor="#c6ff00" />
            </linearGradient>
            <radialGradient id="afn-head">
              <stop offset="0" stopColor="#fbffe6" />
              <stop offset="0.45" stopColor="#c6ff00" stopOpacity="0.9" />
              <stop offset="1" stopColor="#c6ff00" stopOpacity="0" />
            </radialGradient>
          </defs>
          {geo?.paths.map((p, i) => {
            if (!p.ok) return null
            const on = lit(i)
            const pre = hover === i && !on
            const dim = m.mode === 'manual' && m.agent >= 0 && !on && !pre
            const end = p.d.split(' ').pop()!.split(',').map(Number)
            const start = p.d.slice(1).split(' ')[0].split(',').map(Number)
            return (
              <g key={i} className={`afn__link ${on ? 'is-on' : ''} ${pre ? 'is-pre' : ''} ${dim ? 'is-dim' : ''} ${on && m.stage !== 'selected' ? 'is-hit' : ''}`} style={{ ['--d' as string]: `${i * 120}ms` }}>
                <path d={p.d} className="afn__glow" />
                <path d={p.d} className="afn__base" pathLength={1} />
                <path d={p.d} className="afn__flow" />
                <path d={p.d} data-path={i} className="afn__lit" pathLength={1} />
                <circle cx={start[0]} cy={start[1]} r="2.6" className="afn__node" />
                <circle cx={end[0]} cy={end[1]} r="4.5" className="afn__end" />
                <circle cx={end[0]} cy={end[1]} r="9" className="afn__ripple" />
              </g>
            )
          })}
          {MODULES.map((_, i) => (
            <circle key={`i${i}`} data-idle={i} r="1.8" className="afn__dot" opacity="0" />
          ))}
          {[0, 1, 2, 3].map((n) => (
            <circle key={`p${n}`} data-packet r="2" className="afn__packet" opacity="0" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <circle key={`c${n}`} data-comet r={n ? 3.4 - n * 0.45 : 5} fill={n ? undefined : 'url(#afn-head)'} className={n ? 'afn__trail' : 'afn__head'} opacity="0" />
          ))}
        </svg>

        <div className="af-col af-col--left">{[0, 1].map(renderConsole)}</div>
        <div className="af-center">
          <Reactor focus={focus} live={live} pulseKey={pulseKey} className="af-core" />
          <p className="af-core__label">
            <b>AgentForce core</b>
            <span>Coordinates the four agents</span>
          </p>
        </div>
        <div className="af-col af-col--right">{[2, 3].map(renderConsole)}</div>
      </div>

      {/* task strip — the same machine, in words */}
      <div className="af-strip">
        <p className="sr-only" aria-live="polite">
          {liveText}
        </p>
        <div className="af-strip__row">
          <div className="af-strip__who">
            {active && m.stage !== 'review' ? (
              <>
                <p className="af-strip__k">
                  <AgentIcon id={active.id} /> {active.name}
                  <span className="af-tag">{m.mode === 'auto' ? 'Auto demo' : 'Interactive demo'}</span>
                </p>
                <p className="af-strip__explain">{active.explain}</p>
              </>
            ) : (
              <>
                <p className="af-strip__k">
                  <Glyph name="spark" size={14} /> AgentForce
                  <span className="af-tag">{m.mode === 'auto' ? 'Auto demo' : 'Interactive demo'}</span>
                </p>
                <p className="af-strip__explain">{m.stage === 'review' ? REVIEW_STEP : DEMO_REQUEST}</p>
              </>
            )}
          </div>
          <ol className="af-steps">
            {active && m.stage !== 'review' ? (
              active.steps.map((s, k) => {
                const st = m.stage === 'complete' ? 'done' : m.stage === 'processing' ? (k < m.step ? 'done' : k === m.step ? 'now' : 'next') : 'next'
                return (
                  <li key={`${active.id}${k}`} className={`is-${st}`}>
                    <i />
                    {s}
                  </li>
                )
              })
            ) : (
              <>
                {MODULES.map((mod) => (
                  <li key={mod.id} className={m.stage === 'review' ? 'is-done' : 'is-next'}>
                    <i />
                    {mod.name.replace(' Agent', '')}
                  </li>
                ))}
                <li className={`af-steps__human ${m.stage === 'review' ? 'is-now' : 'is-next'}`}>
                  <i />
                  You approve
                </li>
              </>
            )}
          </ol>
          <div className="af-ctl">
            <p className={`af-done ${m.stage === 'complete' ? 'is-on' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="m3.5 8.4 2.9 2.9 6-6.4" />
              </svg>
              {active && m.stage === 'complete' ? active.result : ''}
            </p>
            <div className="af-ctl__btns">
              <button type="button" className="af-btn" data-magnetic onClick={() => (m.mode === 'manual' && m.agent >= 0 ? select(m.agent) : dispatch({ t: 'resume' }))}>
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path d="M5 12a7 7 0 1 0 2.1-5M5 4.5V8h3.5" />
                </svg>
                Replay demo
              </button>
              {m.mode === 'manual' && live && (
                <button type="button" className="af-btn af-btn--primary" data-magnetic onClick={() => dispatch({ t: 'resume' })}>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M8 5.5v13l10-6.5Z" />
                  </svg>
                  Resume auto
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="af-strip__demo">Interactive demonstration · scripted sample tasks · no live agents, data or systems connected</p>
      </div>
    </div>
  )
}

/* memoised: the section re-rendering never re-renders the network */
export default memo(AgentForce)
