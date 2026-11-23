import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { STAGES, type Scenario } from './workflowData'
import { Glyph } from '../glyphs'

/* ---------------------------------------------------------------------------
   The panel is laid out with CSS grid. Nodes sit in a real grid/list; the SVG
   layer reads the node centres after layout and draws the connections between
   them, so paths always meet their nodes at every size.
--------------------------------------------------------------------------- */
type Pt = { x: number; y: number }
const STRANDS = [
  { a: 20, k: 1 },
  { a: -14, k: 1.6 },
  { a: 8, k: 2.3 },
]
const PARTICLES_PER_LINK = 3

function wavePath(p0: Pt, p1: Pt, amp: number, vertical: boolean) {
  if (!vertical) {
    const dx = (p1.x - p0.x) / 3
    return `M${p0.x},${p0.y} C${p0.x + dx},${p0.y - amp} ${p1.x - dx},${p1.y + amp} ${p1.x},${p1.y}`
  }
  const dy = (p1.y - p0.y) / 3
  return `M${p0.x},${p0.y} C${p0.x + amp},${p0.y + dy} ${p1.x - amp},${p1.y - dy} ${p1.x},${p1.y}`
}

const NODE_GLYPH = { trigger: 'trigger', brain: 'brain', integrate: 'link', action: 'action', optimize: 'optimize' } as const

type Props = { scenario: Scenario; reduced: boolean }
type Geo = { w: number; h: number; pts: Pt[]; r: number }

export default function WorkflowEngine({ scenario, reduced }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const visibleRef = useRef(false)
  const linkState = useRef([0, 0, 0, 0]) // 0 pending · 1 travelling · 2 done (drives particles)
  const amp = useRef([1, 1, 1, 1])

  const [geo, setGeo] = useState<Geo | null>(null)
  const [vertical, setVertical] = useState(false)
  const [active, setActive] = useState(reduced ? 5 : -1) // -1 idle · 0..4 stage · 5 complete
  const [working, setWorking] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const selectedRef = useRef<number | null>(null)
  selectedRef.current = selected

  /* ---- orientation from the panel width, geometry from the real DOM ---- */
  const measure = useCallback(() => {
    const st = stageRef.current
    if (!st) return
    const v = st.clientWidth < 520
    setVertical(v)
    // centres from layout offsets (immune to entrance/scale transforms): button → list → stage
    const pts = btnRefs.current.map((b) => {
      if (!b) return { x: 0, y: 0 }
      let x = b.offsetWidth / 2
      let y = b.offsetHeight / 2
      let el: HTMLElement | null = b
      while (el && el !== st) {
        x += el.offsetLeft
        y += el.offsetTop
        el = el.offsetParent as HTMLElement | null
      }
      return { x, y }
    })
    const r = (btnRefs.current[0]?.offsetWidth ?? 60) / 2
    setGeo((g) => {
      const same = g && g.w === st.clientWidth && g.h === st.clientHeight && g.pts.every((p, i) => Math.abs(p.x - pts[i].x) < 0.5 && Math.abs(p.y - pts[i].y) < 0.5)
      return same ? g : { w: st.clientWidth, h: st.clientHeight, pts, r }
    })
  }, [])

  useLayoutEffect(() => {
    const st = stageRef.current!
    const ro = new ResizeObserver(() => measure())
    ro.observe(st)
    measure()
    return () => ro.disconnect()
  }, [measure, vertical])

  const link = useCallback(
    (i: number): [Pt, Pt] => {
      const a = geo!.pts[i]
      const b = geo!.pts[i + 1]
      const off = geo!.r + 5
      return vertical ? [{ x: a.x, y: a.y + off }, { x: b.x, y: b.y - off }] : [{ x: a.x + off, y: a.y }, { x: b.x - off, y: b.y }]
    },
    [geo, vertical],
  )

  /* ---- per-frame: breathing strands, carrier waves, particles ---- */
  useEffect(() => {
    if (!geo || reduced) return
    const svg = svgRef.current!
    const strands = svg.querySelectorAll<SVGPathElement>('[data-strand]')
    const carriers = svg.querySelectorAll<SVGPathElement>('[data-carrier]')
    const guides = [...svg.querySelectorAll<SVGPathElement>('[data-guide]')]
    const parts = [...svg.querySelectorAll<SVGCircleElement>('[data-particle]')]
    const tick = () => {
      if (!visibleRef.current) return
      const t = performance.now() / 1000
      strands.forEach((p) => {
        const i = Number(p.dataset.seg)
        const s = STRANDS[Number(p.dataset.strand)]
        const [p0, p1] = link(i)
        const breathe = Math.sin(t * 0.9 * s.k + i * 1.3)
        p.setAttribute('d', wavePath(p0, p1, s.a * (0.6 + 0.4 * breathe) * amp.current[i], vertical))
      })
      if (!vertical && carriers.length) {
        const cy = geo.pts[0].y
        const energy = 1 + (Math.max(...amp.current) - 1) * 0.7
        carriers.forEach((p, c) => {
          const A = [40, 30, 20][c] * energy
          const f = [1.6, 2.3, 3.1][c]
          const sp = [0.55, -0.4, 0.7][c]
          let d = ''
          for (let k = 0; k <= 48; k++) {
            const x = (k / 48) * geo.w
            const env = Math.sin((Math.PI * k) / 48) ** 1.4
            const y = cy + A * env * Math.sin((k / 48) * Math.PI * 2 * f + t * sp + c * 2.1)
            d += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
          }
          p.setAttribute('d', d)
        })
      }
      // particles drift along each link in the direction of flow
      parts.forEach((c, n) => {
        const i = Math.floor(n / PARTICLES_PER_LINK)
        const k = n % PARTICLES_PER_LINK
        const g = guides[i]
        const len = g.getTotalLength()
        const state = linkState.current[i]
        const speed = state === 1 ? 0.55 : state === 2 ? 0.28 : 0.14
        const u = (t * speed + k / PARTICLES_PER_LINK) % 1
        const pt = g.getPointAtLength(u * len)
        c.setAttribute('cx', pt.x.toFixed(1))
        c.setAttribute('cy', pt.y.toFixed(1))
        const fade = Math.sin(u * Math.PI)
        c.setAttribute('opacity', ((state === 0 ? 0.22 : state === 1 ? 0.95 : 0.6) * fade).toFixed(2))
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [geo, vertical, reduced, link])

  /* ---- the run ---- */
  const build = useCallback(() => {
    tlRef.current?.kill()
    const svg = svgRef.current
    if (!svg || !geo || reduced) return
    const trails = [...svg.querySelectorAll<SVGPathElement>('[data-trail]')]
    const comets = [...svg.querySelectorAll<SVGPathElement>('[data-comet]')]
    const pulses = [...svg.querySelectorAll<SVGCircleElement>('[data-pulse]')]
    const dot = svg.querySelector<SVGGElement>('[data-signal]')!
    const lens = trails.map((p) => p.getTotalLength())
    trails.forEach((p, i) => gsap.set(p, { strokeDasharray: lens[i], strokeDashoffset: lens[i], opacity: 1 }))
    comets.forEach((p, i) => gsap.set(p, { strokeDasharray: `46 ${lens[i] + 60}`, strokeDashoffset: 46, opacity: 0 }))
    gsap.set(dot, { opacity: 0 })
    gsap.set(pulses, { attr: { r: geo.r }, opacity: 0 })
    linkState.current = [0, 0, 0, 0]

    const pulse = (tl: gsap.core.Timeline, i: number, big = false) =>
      tl.fromTo(
        pulses[i],
        { attr: { r: geo.r + 2 }, opacity: big ? 0.9 : 0.7 },
        { attr: { r: geo.r + (big ? 46 : 28) }, opacity: 0, duration: big ? 1.3 : 0.9, ease: 'power2.out', immediateRender: false },
        '<',
      )

    const tl = gsap.timeline({ paused: !visibleRef.current || selectedRef.current !== null, onComplete: () => build() })
    tl.call(() => {
      setActive(-1)
      setWorking(false)
    })
    tl.to({}, { duration: 0.45 })
    STAGES.forEach((_, i) => {
      tl.call(() => {
        setActive(i)
        setWorking(true)
      })
      pulse(tl, i)
      tl.to({}, { duration: i === 1 ? 1.3 : 0.85 }, '<') // AI Brain takes a beat longer
      tl.call(() => setWorking(false))
      tl.to({}, { duration: 0.45 })
      if (i < 4) {
        const trail = trails[i]
        const comet = comets[i]
        const len = lens[i]
        const proxy = { d: 0 }
        tl.call(() => {
          linkState.current[i] = 1
        })
        tl.set(dot, { opacity: 1 })
        tl.set(comet, { opacity: 1 }, '<')
        tl.to(amp.current, { [i]: 2, duration: 0.35, ease: 'power2.out' }, '<')
        tl.to(trail, { strokeDashoffset: 0, duration: 1.15, ease: 'power1.inOut' }, '<')
        tl.to(comet, { strokeDashoffset: -len + 6, duration: 1.15, ease: 'power1.inOut' }, '<')
        tl.to(
          proxy,
          {
            d: 1,
            duration: 1.15,
            ease: 'power1.inOut',
            onUpdate: () => {
              const pt = trail.getPointAtLength(proxy.d * len)
              dot.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
            },
          },
          '<',
        )
        tl.set(dot, { opacity: 0 })
        tl.to(comet, { opacity: 0, duration: 0.25 }, '<')
        tl.call(() => {
          linkState.current[i] = 2
        })
        tl.to(amp.current, { [i]: 1, duration: 0.7, ease: 'power2.inOut' }, '<')
      }
    })
    tl.call(() => setActive(5))
    pulse(tl, 4, true)
    tl.to(trails, { opacity: 0.55, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<0.1') // completion sweep
    tl.to({}, { duration: 2.1 })
    // soft reset: lit paths fade before the next run, never a hard cut
    tl.to(trails, { opacity: 0, duration: 0.6, ease: 'power1.out' })
    tl.call(() => {
      linkState.current = [0, 0, 0, 0]
    })
    tlRef.current = tl
  }, [geo, reduced])

  useEffect(() => {
    if (reduced) {
      setActive(5)
      return
    }
    const id = window.setTimeout(build, 60)
    return () => {
      window.clearTimeout(id)
      tlRef.current?.kill()
    }
  }, [build, reduced])

  // scenario change: clear any selection and start that scenario's run from the top
  const firstScenario = useRef(true)
  useEffect(() => {
    if (firstScenario.current) {
      firstScenario.current = false
      return
    }
    setSelected(null)
    if (!reduced) {
      build()
      if (visibleRef.current) tlRef.current?.play()
    }
  }, [scenario.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // pause while off screen
  useEffect(() => {
    const el = stageRef.current!
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting
      const tl = tlRef.current
      if (!tl) return
      if (e.isIntersecting && selectedRef.current === null) tl.play()
      else tl.pause()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ---- node selection ---- */
  const select = (i: number) => {
    if (reduced) {
      setSelected((cur) => (cur === i ? null : i))
      return
    }
    if (selected === i) return resume()
    tlRef.current?.pause()
    setSelected(i)
  }
  const resume = useCallback(() => {
    setSelected(null)
    if (!reduced && visibleRef.current) tlRef.current?.play() // continues from where it paused
  }, [reduced])

  useEffect(() => {
    if (selected === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        btnRefs.current[selected]?.focus()
        resume()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, resume])

  const shown = selected ?? active
  const runStep = active >= 0 && active <= 4 ? active : null
  const statusText =
    shown >= 0 && shown <= 4 ? scenario.steps[shown].status : shown === 5 ? 'Workflow complete' : 'Waiting for a trigger…'
  const emphasis = selected ?? hover // links touching this node are emphasised
  const linkClass = (i: number) => (emphasis !== null && (i === emphasis - 1 || i === emphasis) ? 'is-emph' : '')

  return (
    <div className={`engine ${vertical ? 'is-vertical' : ''} ${shown === 5 ? 'is-complete' : ''} ${selected !== null ? 'has-selection' : ''}`}>
      <div className="engine__head">
        <span className={`engine__live ${selected !== null ? 'is-paused' : ''}`}>
          <span className="engine__live-dot" aria-hidden="true" />
          {reduced ? 'Pipeline overview' : selected !== null ? 'Paused · inspecting' : 'Live pipeline preview'}
        </span>
        <span className="engine__demo">Illustrative demo</span>
      </div>

      <div className="engine__title">
        <p className="engine__scenario" key={`sc-${scenario.id}`}>
          {scenario.title}
        </p>
        <p className={`engine__status ${working && selected === null ? 'is-working' : ''}`} aria-hidden="true" key={`st-${scenario.id}-${shown}-${working}`}>
          {working && selected === null ? (
            <span className="engine__thinking">
              {shown === 1 ? 'AI is analysing' : 'Working'}
              <span className="engine__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </span>
          ) : (
            statusText
          )}
        </p>
      </div>

      <div ref={stageRef} className="engine__stage">
        <svg ref={svgRef} className="engine__svg" width={geo?.w ?? 0} height={geo?.h ?? 0} viewBox={`0 0 ${geo?.w || 1} ${geo?.h || 1}`} aria-hidden="true">
          <defs>
            <linearGradient id="wf-signal" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={vertical ? 0 : geo?.w ?? 1} y2={vertical ? geo?.h ?? 1 : 0}>
              <stop offset="0" stopColor="#3de8ff" />
              <stop offset="1" stopColor="#c6ff00" />
            </linearGradient>
            <radialGradient id="wf-dot">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.3" stopColor="#c6ff00" />
              <stop offset="1" stopColor="#c6ff00" stopOpacity="0" />
            </radialGradient>
            <filter id="wf-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {geo && (
            <>
              {!vertical && [0, 1, 2].map((c) => <path key={`car-${c}`} data-carrier={c} className={`engine__carrier engine__carrier--${c}`} d="" />)}
              {[0, 1, 2, 3].map((i) => {
                const [p0, p1] = link(i)
                const d0 = wavePath(p0, p1, STRANDS[0].a, vertical)
                return (
                  <g key={i} className={`engine__link ${linkClass(i)}`}>
                    {STRANDS.map((s, k) => (
                      <path key={k} data-strand={k} data-seg={i} d={wavePath(p0, p1, s.a, vertical)} className={`engine__strand engine__strand--${k}`} />
                    ))}
                    <path data-guide={i} d={d0} className="engine__guide" />
                    <path data-trail={i} d={d0} className="engine__trail" stroke="url(#wf-signal)" style={reduced ? { strokeDasharray: 'none' } : undefined} />
                    <path data-comet={i} d={d0} className="engine__comet" />
                    <path d={d0} className="engine__emph" stroke="url(#wf-signal)" />
                    {Array.from({ length: PARTICLES_PER_LINK }, (_, k) => (
                      <circle key={k} data-particle r="1.8" className="engine__particle" cx={p0.x} cy={p0.y} opacity="0" />
                    ))}
                  </g>
                )
              })}
              {geo.pts.map((p, i) => (
                <circle key={`pulse-${i}`} data-pulse={i} cx={p.x} cy={p.y} r={geo.r} className="engine__pulse" opacity="0" />
              ))}
              <g data-signal style={{ opacity: 0 }}>
                <circle r="16" fill="url(#wf-dot)" opacity="0.6" />
                <circle r="3.5" fill="#f4ffd6" />
              </g>
            </>
          )}
        </svg>

        <ol className="engine__nodes">
          {STAGES.map((s, i) => {
            const state = selected !== null ? (i === selected ? 'active' : i < selected ? 'done' : 'pending') : i < active || active === 5 ? 'done' : i === active ? 'active' : 'pending'
            return (
              <li key={s.id} className={`node node--${state} ${selected === i ? 'is-selected' : ''} ${i === 1 && working && active === 1 && selected === null ? 'is-thinking' : ''}`}>
                <button
                  ref={(el) => {
                    btnRefs.current[i] = el
                  }}
                  type="button"
                  className="node__btn"
                  onClick={() => select(i)}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`Stage ${i + 1} of 5, ${s.name}: ${scenario.steps[i].label}`}
                  aria-pressed={selected === i}
                  aria-controls="wf-detail"
                >
                  <Glyph name={NODE_GLYPH[s.id]} size={22} />
                  <span className="node__check" aria-hidden="true" />
                </button>
                <span className="node__text">
                  <span className="node__name">{s.name}</span>
                  <span className="node__label" key={scenario.id}>
                    {scenario.steps[i].label}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* contextual detail: always occupies the same space (no layout shift) */}
      <div id="wf-detail" className={`engine__detail ${selected !== null ? 'is-on' : ''}`} aria-live="polite">
        {selected !== null ? (
          <>
            <span className="engine__detail-index">{String(selected + 1).padStart(2, '0')}</span>
            <span className="engine__detail-body">
              <span className="engine__detail-name">
                {STAGES[selected].name} <em>· {scenario.steps[selected].label}</em>
              </span>
              <span className="engine__detail-text">{scenario.steps[selected].status}.</span>
            </span>
            {!reduced && (
              <button type="button" className="engine__resume" onClick={resume}>
                <span className="engine__resume-icon" aria-hidden="true" />
                Resume
              </button>
            )}
          </>
        ) : (
          <span className="engine__hint">{reduced ? 'Select a stage to read what happens there.' : 'Select any stage to pause the run and inspect it.'}</span>
        )}
      </div>

      <div className="engine__foot">
        <div className="engine__systems" aria-label="Connected systems in this example">
          {scenario.systems.map((sys, k) => (
            <span key={`${scenario.id}-${sys}`} className={`engine__system ${shown >= 2 ? 'is-on' : ''}`} style={{ transitionDelay: shown === 2 ? `${k * 140}ms` : '0ms' }}>
              {sys}
            </span>
          ))}
        </div>
        <div className="engine__result">
          <span className="engine__done" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 12.5 4 4 8-9" />
            </svg>
          </span>
          <span className="engine__step-count">
            {selected !== null ? `Step ${selected + 1} of 5` : shown === 5 ? 'Run complete' : runStep !== null ? `Step ${runStep + 1} of 5` : 'Starting run'}
          </span>
        </div>
      </div>

      <ol className={reduced ? 'engine__list' : 'sr-only'}>
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <strong>{s.name}:</strong> {scenario.steps[i].label}. {scenario.steps[i].status}.
          </li>
        ))}
      </ol>
    </div>
  )
}
