import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from '../../lib/env'
import { APPS, COPY, DEFAULTS, PLATFORMS, SERVICES, T, TRIGGERS, buildTasks, type AppId, type PlatformId, type TriggerId } from './automationData'
import { MARKS } from './marks'
import './automation.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   AI Automation — "The automation engine"
   ONE reducer is the workflow: trigger, platform, apps, phase and the run
   clock. Every panel, the routes, the packets and the status strip read
   from it, so the three stages can never disagree.

   Animation ownership
   · React state — selection, phase, run step
   · CSS        — node / route / task state transitions, idle signals
   · GSAP       — scroll entrance + the run packets along the real paths
   ========================================================================== */

type Phase = 'idle' | 'configuring' | 'ready' | 'running' | 'completed'
type S = { trigger: TriggerId; platform: PlatformId; apps: AppId[]; phase: Phase; t: number; run: number; cfg: number; note: string }
type A =
  | { k: 'trigger'; v: TriggerId }
  | { k: 'platform'; v: PlatformId }
  | { k: 'app'; v: AppId }
  | { k: 'settle'; cfg: number }
  | { k: 'run'; instant: boolean }
  | { k: 'tick'; run: number }
  | { k: 'reset' }

const N_OF = (s: S) => buildTasks(s.trigger, s.platform, s.apps).length
const END = (s: S) => 3 + N_OF(s) // t: 1 trigger · 2 route · 3.. tasks · END done

function reduce(s: S, a: A): S {
  const locked = s.phase === 'running'
  switch (a.k) {
    case 'trigger':
      if (locked || s.trigger === a.v) return s
      return { ...s, trigger: a.v, phase: 'configuring', t: 0, cfg: s.cfg + 1, note: '' }
    case 'platform':
      if (locked || s.platform === a.v) return s
      return { ...s, platform: a.v, phase: 'configuring', t: 0, cfg: s.cfg + 1, note: '' }
    case 'app': {
      if (locked) return s
      const on = s.apps.includes(a.v)
      if (on && s.apps.length === 1) return { ...s, note: 'Keep at least one app connected.' }
      const apps = on ? s.apps.filter((x) => x !== a.v) : [...s.apps, a.v]
      return { ...s, apps, phase: 'configuring', t: 0, cfg: s.cfg + 1, note: '' }
    }
    case 'settle':
      return a.cfg === s.cfg && s.phase === 'configuring' ? { ...s, phase: 'ready' } : s
    case 'run':
      if (locked) return s
      return a.instant ? { ...s, phase: 'completed', t: END(s), run: s.run + 1, note: '' } : { ...s, phase: 'running', t: 1, run: s.run + 1, note: '' }
    case 'tick': {
      if (a.run !== s.run || s.phase !== 'running') return s
      const t = s.t + 1
      return t >= END(s) ? { ...s, t: END(s), phase: 'completed' } : { ...s, t }
    }
    case 'reset':
      if (locked) return s
      return { ...DEFAULTS, apps: [...DEFAULTS.apps], phase: 'idle', t: 0, run: s.run + 1, cfg: s.cfg + 1, note: '' }
  }
}

/* ---------------------------------------------------------------- marks */
function Mark({ id, size = 22 }: { id: PlatformId | AppId; size?: number }) {
  if (id === 'ghl')
    return (
      <span className="ax-mark ax-mark--ghl" style={{ fontSize: size * 0.42 }} title="GoHighLevel (placeholder until the official mark is added)">
        GHL
      </span>
    )
  const m = MARKS[id]
  return (
    <svg className="ax-mark" viewBox={m.vb} width={size} height={size} aria-hidden="true" fill="currentColor">
      {m.d ? <path d={m.d} /> : <g dangerouslySetInnerHTML={{ __html: m.body! }} />}
    </svg>
  )
}

const TriggerIcon = ({ id }: { id: TriggerId }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {id === 'lead' && (
      <>
        <circle cx="10" cy="8" r="3.5" />
        <path d="M3.5 19c.9-3.3 3.4-5 6.5-5s5.6 1.7 6.5 5M18.5 7v5M16 9.5h5" />
      </>
    )}
    {id === 'appointment' && (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4M9 14.5l2 2 4-4" />
      </>
    )}
    {id === 'form' && (
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="3" />
        <path d="M8 8.5h8M8 12h8M8 15.5h4.5" />
      </>
    )}
  </svg>
)

/* ---------------------------------------------------------------- network geometry (viewBox 360×280) */
const VB = { w: 360, h: 280 }
const ROW = [60, 140, 220]
const PX = 104 // platform column
const AX = 256 // app column
const HALF = 26
const ortho = (x0: number, y0: number, xm: number, x1: number, y1: number, r = 10) => {
  if (Math.abs(y1 - y0) < 0.5) return `M${x0},${y0} H${x1}`
  const s = Math.sign(y1 - y0)
  return `M${x0},${y0} H${xm - r} Q${xm},${y0} ${xm},${y0 + s * r} V${y1 - s * r} Q${xm},${y1} ${xm + r},${y1} H${x1}`
}
const inRoute = (i: number) => ortho(0, 140, 44, PX - HALF, ROW[i])
const link = (i: number, j: number) => ortho(PX + HALF, ROW[i], 180, AX - HALF, ROW[j])
const outRoute = (j: number) => ortho(AX + HALF, ROW[j], 318, VB.w, 140)
const pct = (v: number, of: number) => `${(v / of) * 100}%`

/* ---------------------------------------------------------------- section */
export default function Automation() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const net = useRef<SVGSVGElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  const [s, dispatch] = useReducer(reduce, { ...DEFAULTS, apps: [...DEFAULTS.apps], phase: 'idle', t: 0, run: 0, cfg: 0, note: '' })
  const [inView, setInView] = useState(false)
  const [drawn, setDrawn] = useState(false)

  const tasks = buildTasks(s.trigger, s.platform, s.apps)
  const trig = TRIGGERS.find((x) => x.id === s.trigger)!
  const pi = PLATFORMS.findIndex((p) => p.id === s.platform)
  const running = s.phase === 'running'
  const done = s.phase === 'completed'
  const end = 3 + tasks.length
  const taskK = s.t - 3 // index of the running task
  const progress = done ? 1 : running ? Math.max(0, s.t - 1) / (end - 1) : 0

  /* configuring → ready once the selection signal has played */
  useEffect(() => {
    if (s.phase !== 'configuring') return
    const id = window.setTimeout(() => dispatch({ k: 'settle', cfg: s.cfg }), live ? 650 : 0)
    return () => window.clearTimeout(id)
  }, [s.phase, s.cfg, live])

  /* the run clock — the only timer; holds while the section is off-screen */
  useEffect(() => {
    if (!running || !inView) return
    const ms = s.t === 1 ? T.trigger : s.t === 2 ? T.route : T.task
    const id = window.setTimeout(() => dispatch({ k: 'tick', run: s.run }), ms)
    return () => window.clearTimeout(id)
  }, [running, inView, s.t, s.run])

  useEffect(() => {
    const el = root.current!
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      const svg = net.current
      if (svg) {
        if (e.isIntersecting) svg.unpauseAnimations()
        else svg.pauseAnimations()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ports: panels 01 and 03 align their ports to the network's real in/out height */
  useLayoutEffect(() => {
    const st = stage.current!
    const measure = () => {
      const m = st.querySelector<HTMLElement>('.ax-net__in')
      if (!m) return
      // layout offsets, not rects: immune to the entrance transforms
      let y = m.offsetHeight / 2
      let el: HTMLElement | null = m
      while (el && el !== st) {
        y += el.offsetTop
        el = el.offsetParent as HTMLElement | null
      }
      st.style.setProperty('--port-y', `${y.toFixed(1)}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(st)
    return () => ro.disconnect()
  }, [])

  /* run packets: one per connected app, along trigger → platform → app → output */
  useEffect(() => {
    if (!live || !running || s.t !== 2) return
    const svg = net.current!
    const tw: gsap.core.Tween[] = []
    s.apps.forEach((a, n) => {
      const j = APPS.findIndex((x) => x.id === a)
      const segs = [inRoute(pi), link(pi, j), outRoute(j)].map((d) => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        p.setAttribute('d', d)
        return p
      })
      const lens = segs.map((p) => p.getTotalLength())
      const total = lens.reduce((x, y) => x + y, 0)
      const dot = svg.querySelector<SVGCircleElement>(`[data-run="${n}"]`)
      if (!dot) return
      const o = { u: 0 }
      tw.push(
        gsap.to(o, {
          u: 1,
          duration: T.route / 1000,
          ease: 'power2.inOut',
          delay: n * 0.08,
          onStart: () => dot.setAttribute('opacity', '1'),
          onUpdate: () => {
            let d = o.u * total
            let k = 0
            while (k < lens.length - 1 && d > lens[k]) d -= lens[k++]
            const pt = segs[k].getPointAtLength(d)
            dot.setAttribute('cx', pt.x.toFixed(1))
            dot.setAttribute('cy', pt.y.toFixed(1))
          },
          onComplete: () => dot.setAttribute('opacity', '0'),
        }),
      )
    })
    return () => {
      tw.forEach((x) => x.kill())
      svg.querySelectorAll('[data-run]').forEach((c) => c.setAttribute('opacity', '0'))
    }
  }, [live, running, s.t, s.apps, pi])

  /* entrance: eyebrow → masked headline → copy → panels → links/routes draw → nodes wake */
  useGSAP(
    () => {
      if (!live) return
      const q = gsap.utils.selector(root)
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.ax__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.ax__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.ax__desc, .ax__index'), { y: 16, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.45)
      gsap
        .timeline({
          scrollTrigger: { trigger: stage.current, start: 'top 78%', once: true },
          defaults: { ease: 'power3.out' },
        })
        .from(q('.ax-panel'), { y: 36, opacity: 0, duration: 1, stagger: 0.12, clearProps: 'transform,opacity' })
        .add(() => setDrawn(true), 0.55)
        .from(q('.ax-strip, .ax-svc'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.06, clearProps: 'transform,opacity' }, 0.6)
    },
    { scope: root, dependencies: [live] },
  )
  useEffect(() => {
    if (!live) setDrawn(true)
  }, [live])

  /* panel pointer light (CSS vars only) */
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!live || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  }

  /* radio groups: arrow keys move the selection (roving tabindex) */
  const arrows = <V extends string>(list: { id: V }[], cur: V, set: (v: V) => void) => (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const i = (list.findIndex((x) => x.id === cur) + d + list.length) % list.length
    set(list[i].id)
    const g = e.currentTarget as HTMLElement
    requestAnimationFrame(() => g.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
  }

  const statusText = running
    ? s.t === 1
      ? `Trigger fired · ${trig.t}`
      : s.t === 2
        ? `Routing through ${PLATFORMS[pi].t}`
        : `Step ${taskK + 1} of ${tasks.length} · ${tasks[taskK].t}`
    : done
      ? `Workflow completed · ${tasks.length} of ${tasks.length} steps`
      : s.phase === 'configuring'
        ? 'Updating workflow…'
        : s.phase === 'ready'
          ? 'Ready to run'
          : 'Ready · sample workflow'

  const lock = running ? { 'aria-disabled': true } : {}
  const stateCls = `is-${s.phase} ${running ? `at-${Math.min(s.t, 3)}` : ''} ${inView ? '' : 'is-offscreen'}`

  return (
    <section ref={root} id="ai-automation" className={`ax ${stateCls} ${drawn ? 'is-drawn' : ''}`} aria-labelledby="ax-title">
      <div className="ax__grid-bg" aria-hidden="true" />
      <div className="ax__inner">
        <header className="ax__head">
          <div className="ax__copy">
            <p className="ax__eyebrow">
              <span aria-hidden="true" />
              {COPY.eyebrow}
            </p>
            <h2 id="ax-title" className="ax__title">
              <span className="ax__line">
                <span>{COPY.title[0]}</span>
              </span>
              <span className="ax__line ax__line--accent">
                <span>{COPY.title[1]}</span>
              </span>
            </h2>
            <p className="ax__desc">{COPY.desc}</p>
          </div>
          <div className="ax__index">
            <p className="ax__index-k">{COPY.intro}</p>
            <ol>
              {['Trigger', 'Connect', 'Automate'].map((x, i) => (
                <li key={x} className={(running && s.t - 1 >= i) || done ? 'is-on' : ''}>
                  <b>0{i + 1}</b> {x}
                </li>
              ))}
            </ol>
          </div>
        </header>

        <div ref={stage} className="ax-stage">
          {/* ---------------- 01 · trigger engine ---------------- */}
          <section className={`ax-panel ax-panel--trigger ${running && s.t === 1 ? 'is-firing' : ''}`} onPointerMove={onMove} aria-labelledby="ax-p1">
            <i className="ax-panel__reg" aria-hidden="true" />
            <PanelHead n={COPY.stages[0].n} id="ax-p1" t={COPY.stages[0].t} d={COPY.stages[0].d} />
            <div className="ax-trig" role="radiogroup" aria-label="Trigger" onKeyDown={arrows(TRIGGERS, s.trigger, (v) => dispatch({ k: 'trigger', v }))}>
              {TRIGGERS.map((x) => {
                const on = x.id === s.trigger
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    className={`ax-trig__opt ${on ? 'is-on' : ''}`}
                    onClick={() => dispatch({ k: 'trigger', v: x.id })}
                    {...lock}
                  >
                    <span className="ax-trig__ic">
                      <TriggerIcon id={x.id} />
                    </span>
                    <span className="ax-trig__t">
                      <b>{x.t}</b>
                      <small>{x.src}</small>
                    </span>
                    <span className="ax-trig__led" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
            <div className="ax-event" key={`${s.trigger}-${s.cfg}`} aria-label="Incoming event preview">
              <p className="ax-event__k">
                <span className="ax-event__dot" aria-hidden="true" />
                Incoming event <em>sample</em>
              </p>
              <p className="ax-event__name">{trig.event}</p>
              <dl>
                {trig.fields.map(([k, v], i) => (
                  <div key={k} style={{ ['--i' as string]: i }}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <span className="ax-port ax-port--out" aria-hidden="true">
              <i />
            </span>
          </section>

          <span className="ax-link ax-link--a" aria-hidden="true">
            <i />
          </span>

          {/* ---------------- 02 · integration network ---------------- */}
          <section className={`ax-panel ax-panel--net ${running && s.t === 2 ? 'is-routing' : ''}`} onPointerMove={onMove} aria-labelledby="ax-p2">
            <i className="ax-panel__reg" aria-hidden="true" />
            <PanelHead n={COPY.stages[1].n} id="ax-p2" t={COPY.stages[1].t} d={COPY.stages[1].d} />
            <div className="ax-net">
              <div className="ax-net__cols" aria-hidden="true">
                <span style={{ left: pct(PX, VB.w) }}>Platform</span>
                <span style={{ left: pct(AX, VB.w) }}>Apps</span>
              </div>
              <div className="ax-net__map">
                <svg ref={net} className="ax-net__svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
                  <defs>
                    <linearGradient id="ax-route" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#3de8ff" />
                      <stop offset="1" stopColor="#c6ff00" />
                    </linearGradient>
                    <pattern id="ax-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.8" fill="rgb(232 255 245 / 0.09)" />
                    </pattern>
                  </defs>
                  <rect width={VB.w} height={VB.h} fill="url(#ax-dots)" />
                  {/* candidate routes */}
                  {PLATFORMS.map((p, i) => (
                    <path key={p.id} d={inRoute(i)} pathLength={1} className={`ax-r ax-r--in ${i === pi ? 'is-on' : ''}`} />
                  ))}
                  {APPS.map((a, j) => {
                    const on = s.apps.includes(a.id)
                    return (
                      <g key={a.id}>
                        <path d={link(pi, j)} pathLength={1} className={`ax-r ${on ? 'is-on' : 'is-off'}`} />
                        <path d={outRoute(j)} pathLength={1} className={`ax-r ax-r--out ${on ? 'is-on' : 'is-off'}`} />
                        {on && live && (
                          <circle r="1.8" className="ax-trickle">
                            <animateMotion dur={`${3.2 + j * 0.5}s`} repeatCount="indefinite" path={`${inRoute(pi)} ${link(pi, j).replace('M', 'L')} ${outRoute(j).replace('M', 'L')}`} />
                          </circle>
                        )}
                      </g>
                    )
                  })}
                  {[0, 1, 2].map((n) => (
                    <circle key={n} data-run={n} r="4" className="ax-packet" opacity="0" />
                  ))}
                  <circle cx="0" cy="140" r="3.5" className="ax-net__port" />
                  <circle cx={VB.w} cy="140" r="3.5" className="ax-net__port" />
                </svg>
                <span className="ax-net__in" style={{ top: pct(140, VB.h) }} aria-hidden="true" />

                <div className="ax-net__group" role="radiogroup" aria-label="Automation platform" onKeyDown={arrows(PLATFORMS, s.platform, (v) => dispatch({ k: 'platform', v }))}>
                  {PLATFORMS.map((p, i) => {
                    const on = p.id === s.platform
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${p.t} automation platform`}
                        tabIndex={on ? 0 : -1}
                        className={`ax-node ${on ? 'is-on' : ''} ${on && running && s.t >= 3 && taskK === 0 ? 'is-busy' : ''}`}
                        style={{ left: pct(PX, VB.w), top: pct(ROW[i], VB.h) }}
                        onClick={() => dispatch({ k: 'platform', v: p.id })}
                        {...lock}
                      >
                        <Mark id={p.id} />
                        <span className="ax-node__t">{p.t}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="ax-net__group" role="group" aria-label="Connected apps">
                  {APPS.map((a, j) => {
                    const on = s.apps.includes(a.id)
                    const busy = running && s.t >= 3 && tasks[taskK]?.by === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${a.t} (${a.role})`}
                        className={`ax-node ax-node--app ${on ? 'is-on' : ''} ${busy ? 'is-busy' : ''}`}
                        style={{ left: pct(AX, VB.w), top: pct(ROW[j], VB.h) }}
                        onClick={() => dispatch({ k: 'app', v: a.id })}
                        {...lock}
                      >
                        <Mark id={a.id} />
                        <span className="ax-node__t">
                          {a.t === 'GoHighLevel' ? 'GoHighLevel' : a.t} <em>{a.role}</em>
                        </span>
                        <span className="ax-node__chk" aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="ax-net__path" aria-hidden="true">
                <span>{trig.t}</span> → <span>{PLATFORMS[pi].t}</span> → <span>{s.apps.map((a) => APPS.find((x) => x.id === a)!.t).join(' + ')}</span>
              </p>
            </div>
          </section>

          <span className="ax-link ax-link--b" aria-hidden="true">
            <i />
          </span>

          {/* ---------------- 03 · execution console ---------------- */}
          <section className={`ax-panel ax-panel--exec ${done ? 'is-complete' : ''}`} onPointerMove={onMove} aria-labelledby="ax-p3">
            <i className="ax-panel__reg" aria-hidden="true" />
            <span className="ax-port ax-port--in" aria-hidden="true">
              <i />
            </span>
            <PanelHead n={COPY.stages[2].n} id="ax-p3" t={COPY.stages[2].t} d={COPY.stages[2].d}>
              <svg className="ax-ring" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15" className="ax-ring__track" />
                <circle cx="18" cy="18" r="15" pathLength={1} className="ax-ring__val" style={{ strokeDashoffset: 1 - progress }} />
                <text x="18" y="21.5" textAnchor="middle">
                  {Math.round(progress * 100)}
                </text>
              </svg>
            </PanelHead>
            <ol className="ax-tasks">
              <li className={`ax-task ax-task--trigger ${running && s.t === 1 ? 'is-run' : (running && s.t > 1) || done ? 'is-done' : ''}`}>
                <span className="ax-task__node" aria-hidden="true" />
                <span className="ax-task__t">
                  <b>{trig.t}</b>
                  <small>Trigger · {trig.event}</small>
                </span>
                <span className="ax-task__by" aria-hidden="true">
                  <TriggerIcon id={s.trigger} />
                </span>
              </li>
              {tasks.map((k, i) => {
                const st = done || (running && taskK > i) ? 'is-done' : running && taskK === i ? 'is-run' : ''
                return (
                  <li key={k.id} className={`ax-task ${st}`}>
                    <span className="ax-task__node" aria-hidden="true" />
                    <span className="ax-task__t">
                      <b>{k.t}</b>
                      <small>{st === 'is-done' ? 'Done' : st === 'is-run' ? 'Running…' : 'Queued'}</small>
                    </span>
                    <span className="ax-task__by" aria-hidden="true">
                      <Mark id={k.by} size={16} />
                    </span>
                    <span className="ax-task__bar" aria-hidden="true" style={{ animationDuration: `${T.task}ms` }} />
                  </li>
                )
              })}
            </ol>
            <div className="ax-result" aria-hidden={!done}>
              <span className="ax-result__ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="m6 12.5 4 4 8-9" />
                </svg>
              </span>
              <p>
                <b>Workflow completed</b>
                <small>
                  {tasks.length} steps · simulated in your browser · nothing was sent
                </small>
              </p>
            </div>
          </section>

          {/* ---------------- control / status strip ---------------- */}
          <div className="ax-strip">
            <dl className="ax-strip__cfg">
              <div>
                <dt>Trigger</dt>
                <dd>
                  <TriggerIcon id={s.trigger} /> {trig.t}
                </dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>
                  <Mark id={s.platform} size={16} /> {PLATFORMS[pi].t}
                </dd>
              </div>
              <div>
                <dt>Apps</dt>
                <dd>
                  {s.apps.map((a) => (
                    <Mark key={a} id={a} size={16} />
                  ))}
                  <span className="sr-only">{s.apps.map((a) => APPS.find((x) => x.id === a)!.t).join(', ')}</span>
                </dd>
              </div>
            </dl>
            <p className="ax-strip__status">
              <span className="ax-strip__led" aria-hidden="true" />
              <span role="status" aria-live="polite">
                {statusText}
              </span>
              {s.note && <em className="ax-strip__note">{s.note}</em>}
            </p>
            <div className="ax-strip__btns">
              {done ? (
                <>
                  <button type="button" className="btn btn--primary ax-run" data-magnetic onClick={() => dispatch({ k: 'run', instant: !live })}>
                    <IcReplay /> Replay demo
                  </button>
                  <button type="button" className="ax-ghost" onClick={() => dispatch({ k: 'reset' })}>
                    Reset
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn--primary ax-run"
                    data-magnetic
                    onClick={() => dispatch({ k: 'run', instant: !live })}
                    aria-disabled={running || undefined}
                  >
                    {running ? (
                      <>
                        <span className="ax-run__spin" aria-hidden="true" /> Running
                      </>
                    ) : (
                      <>
                        <IcPlay /> Run demo
                      </>
                    )}
                  </button>
                  {s.phase !== 'idle' && !running && (
                    <button type="button" className="ax-ghost" onClick={() => dispatch({ k: 'reset' })}>
                      Reset
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="ax-strip__sim">Interactive simulation · sample data · no live integrations, messages or CRM changes</p>
          </div>
        </div>

        {/* live service categories, linked to the chosen trigger */}
        <ul className="ax-svcs">
          {SERVICES.map((v) => (
            <li key={v.id} className={`ax-svc ${v.trigger === s.trigger ? 'is-rel' : ''}`}>
              <p className="ax-svc__t">
                {v.t}
                {v.trigger === s.trigger && <span className="ax-svc__rel">Related to this workflow</span>}
              </p>
              <p className="ax-svc__d">{v.d}</p>
              <p className="ax-svc__tags">
                {v.tags.map((g) => (
                  <span key={g}>{g}</span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PanelHead({ n, id, t, d, children }: { n: string; id: string; t: string; d: string; children?: React.ReactNode }) {
  return (
    <header className="ax-panel__head">
      <p className="ax-panel__n">{n}</p>
      <div>
        <h3 id={id}>{t}</h3>
        <p>{d}</p>
      </div>
      {children}
    </header>
  )
}

const IcPlay = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">
    <path d="M8 5.5v13l10-6.5Z" />
  </svg>
)
const IcReplay = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.8" />
    <path d="M2.6 2.4v2.9h2.9" />
  </svg>
)
