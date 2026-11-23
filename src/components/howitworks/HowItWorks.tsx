import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from '../../lib/env'
import './howitworks.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   How It Works — "The intelligence journey"
   Four luminous floating tiles joined by an energy path. One `active` index
   drives tiles, path, details and controls. Scroll advances it naturally
   (no pinning) until the visitor picks a step; then their choice wins until
   they scroll away.

   Copy is verbatim from the live section. Detail chips only restate it.
   ========================================================================== */
const STEPS = [
  {
    n: '01',
    t: 'Share your business',
    d: 'Enter your name, website, and social links. Optional context welcome.',
    chips: ['Your name', 'Your website', 'Social links', 'Optional context'],
    vis: 'link',
  },
  {
    n: '02',
    t: 'Talk to the AI Consultant',
    d: 'We research first, then ask focused questions about goals and pain points.',
    chips: ['Research first', 'Focused questions', 'Goals', 'Pain points'],
    vis: 'wave',
  },
  {
    n: '03',
    t: 'Get your blueprint preview',
    d: 'See problems, opportunities, and recommended TechTivAI services.',
    chips: ['Problems', 'Opportunities', 'Recommended services'],
    vis: 'doc',
  },
  {
    n: '04',
    t: 'Pay for the next website',
    d: 'The first blueprint is free. A different website later is a one-time payment before research starts.',
    chips: ['First blueprint: free', 'Different website later: one-time payment', 'Paid before research starts'],
    vis: 'site',
  },
] as const

/* micro-visuals: one per step, same stroke family */
function Micro({ k }: { k: string }) {
  return (
    <svg className={`hw-mv hw-mv--${k}`} viewBox="0 0 64 22" aria-hidden="true">
      {k === 'link' && (
        <>
          <rect x="1" y="3" width="44" height="16" rx="8" className="hw-mv__box" />
          <path d="M9 11h6M12 8.5a2.5 2.5 0 0 1 0 5" className="hw-mv__s" />
          <path d="M19 11h20" className="hw-mv__l" />
          <circle cx="55" cy="11" r="7" className="hw-mv__ok" />
          <path d="m51.8 11.2 2.2 2.2 3.8-4.2" className="hw-mv__tick" />
        </>
      )}
      {k === 'wave' &&
        [3, 7, 12, 8, 15, 10, 6, 13, 9, 5, 11, 7, 4].map((h, i) => <rect key={i} x={2 + i * 4.7} y={11 - h / 2} width="2.2" height={h} rx="1.1" className="hw-mv__bar" style={{ animationDelay: `${i * 90}ms` }} />)}
      {k === 'doc' && (
        <>
          <rect x="1" y="1" width="20" height="20" rx="4" className="hw-mv__box" />
          <path d="M5.5 7h11M5.5 11h11M5.5 15h7" className="hw-mv__l" />
          <path d="M26 6h12M26 11h22M26 16h16" className="hw-mv__l" />
          <circle cx="56" cy="11" r="4" className="hw-mv__dot" />
        </>
      )}
      {k === 'site' && (
        <>
          <rect x="1" y="2" width="34" height="18" rx="4" className="hw-mv__box" />
          <path d="M1 7h34" className="hw-mv__l" />
          <path d="M6 12h14M6 15.5h9" className="hw-mv__s" />
          <path d="M40 11h8" className="hw-mv__l" />
          <path d="M53 4.5v13M53 5.5h8l-2.2 3 2.2 3h-8" className="hw-mv__flag" />
        </>
      )}
    </svg>
  )
}

type Seg = { d: string; len: number }

export default function HowItWorks() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const tiles = useRef<(HTMLSpanElement | null)[]>([])
  const reduced = useReducedMotion()
  const live = !reduced
  const [active, setActive] = useState(0)
  const [segs, setSegs] = useState<Seg[]>([])
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [drawn, setDrawn] = useState(false)
  const [inView, setInView] = useState(false)
  const picked = useRef(false)

  const go = useCallback((i: number, user = true) => {
    if (user) picked.current = true
    setActive(Math.max(0, Math.min(STEPS.length - 1, i)))
  }, [])

  /* geometry: tile centres from layout offsets (immune to float/entrance transforms) */
  useLayoutEffect(() => {
    const st = stage.current!
    const measure = () => {
      const pts = tiles.current.map((t) => {
        if (!t) return { x: 0, y: 0 }
        let x = t.offsetWidth / 2
        let y = t.offsetHeight / 2
        let el: HTMLElement | null = t
        while (el && el !== st) {
          x += el.offsetLeft
          y += el.offsetTop
          el = el.offsetParent as HTMLElement | null
        }
        return { x, y }
      })
      const r = (tiles.current[0]?.offsetWidth ?? 160) / 2
      const out: Seg[] = []
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const horiz = Math.abs(dx) >= Math.abs(dy)
        // start / end on the tile rim, leave and arrive along the main axis
        const s = horiz ? { x: a.x + Math.sign(dx) * (r + 10), y: a.y } : { x: a.x, y: a.y + Math.sign(dy) * (r + 10) }
        const e = horiz ? { x: b.x - Math.sign(dx) * (r + 10), y: b.y } : { x: b.x, y: b.y - Math.sign(dy) * (r + 10) }
        const k = horiz ? (e.x - s.x) * 0.5 : (e.y - s.y) * 0.5
        const d = horiz
          ? `M${s.x.toFixed(1)},${s.y.toFixed(1)} C${(s.x + k).toFixed(1)},${s.y.toFixed(1)} ${(e.x - k).toFixed(1)},${e.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}`
          : `M${s.x.toFixed(1)},${s.y.toFixed(1)} C${s.x.toFixed(1)},${(s.y + k).toFixed(1)} ${e.x.toFixed(1)},${(e.y - k).toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}`
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        p.setAttribute('d', d)
        out.push({ d, len: p.getTotalLength() })
      }
      setSegs(out)
      setBox({ w: st.clientWidth, h: st.clientHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(st)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!live) setDrawn(true)
  }, [live])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      // scroll-driven progression (natural scroll, no pin). A manual pick holds
      // until the section is left, then scroll takes over again.
      ScrollTrigger.create({
        trigger: stage.current,
        start: 'top 72%',
        // stage bottom at 38% of the viewport — or the furthest the page can scroll,
        // so the journey always completes even when this is the last section
        end: () => {
          const st = stage.current!
          const y = st.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.38
          return Math.min(y, ScrollTrigger.maxScroll(window) - 2)
        },
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (picked.current) return
          setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length * 0.999)))
        },
        onLeave: () => {
          picked.current = false
          setActive(STEPS.length - 1)
        },
        onLeaveBack: () => {
          picked.current = false
          setActive(0)
        },
      })
      if (!live) return
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.hw__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.hw__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.hw__nav'), { y: 12, opacity: 0, duration: 0.7 }, 0.5)
      gsap
        .timeline({ scrollTrigger: { trigger: stage.current, start: 'top 82%', once: true }, defaults: { ease: 'expo.out' } })
        .from(q('.hw-step'), { y: 60, opacity: 0, scale: 0.94, duration: 1.2, stagger: 0.16, clearProps: 'transform,opacity' })
        .add(() => setDrawn(true), 0.7)
        .from(q('.hw__amb'), { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0.6)
        .from(q('.hw-detail'), { y: 20, opacity: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.8)
    },
    { scope: root, dependencies: [live] },
  )

  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const i = Math.max(0, Math.min(STEPS.length - 1, active + d))
    go(i)
    requestAnimationFrame(() => root.current?.querySelectorAll<HTMLElement>('.hw-step')[i]?.focus())
  }
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!live || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  }

  const s = STEPS[active]
  return (
    <section ref={root} id="how-it-works" className={`hw ${drawn ? 'is-drawn' : ''} ${inView ? '' : 'is-offscreen'}`} aria-labelledby="hw-title">
      <div className="hw__amb" aria-hidden="true" />
      <div className="hw__inner">
        <header className="hw__head">
          <div>
            <p className="hw__eyebrow">
              <span aria-hidden="true" />
              How It Works
            </p>
            <h2 id="hw-title" className="hw__title">
              <span className="hw__line">
                <span>From first link to</span>
              </span>
              <span className="hw__line hw__line--accent">
                <span>full AI Blueprint</span>
              </span>
            </h2>
          </div>
          <div className="hw__nav">
            <p className="hw__count" aria-hidden="true">
              <b>{s.n}</b> / 04
            </p>
            <button type="button" className="hw__arrow" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous step">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M19 12H6M11 6.5 5.5 12l5.5 5.5" />
              </svg>
            </button>
            <button type="button" className="hw__arrow" onClick={() => go(active + 1)} disabled={active === STEPS.length - 1} aria-label="Next step">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
              </svg>
            </button>
          </div>
        </header>

        <div ref={stage} className="hw-stage">
          <svg className="hw-path" width={box.w} height={box.h} viewBox={`0 0 ${box.w || 1} ${box.h || 1}`} aria-hidden="true">
            <defs>
              <linearGradient id="hw-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#3de8ff" />
                <stop offset="1" stopColor="#c6ff00" />
              </linearGradient>
            </defs>
            {segs.map((g, i) => {
              const done = active > i
              const lead = active === i + 1
              return (
                <g key={i} className={`hw-seg ${done ? 'is-done' : ''} ${lead ? 'is-lead' : ''}`} style={{ ['--len' as string]: g.len, ['--d' as string]: `${i * 220}ms` }}>
                  <path d={g.d} className="hw-seg__base" />
                  <path d={g.d} className="hw-seg__glow" />
                  <path d={g.d} className="hw-seg__fill" />
                  {live && (
                    <circle r="2.4" className="hw-seg__p">
                      <animateMotion dur={`${2.6 + i * 0.3}s`} repeatCount="indefinite" path={g.d} />
                    </circle>
                  )}
                </g>
              )
            })}
          </svg>

          <div className="hw-steps" role="group" aria-label="The four steps" onKeyDown={onKey}>
            {STEPS.map((x, i) => {
              const on = i === active
              return (
                <button
                  key={x.n}
                  type="button"
                  className={`hw-step hw-step--${i + 1} ${on ? 'is-on' : ''} ${i < active ? 'is-past' : ''}`}
                  aria-current={on ? 'step' : undefined}
                  aria-controls="hw-detail"
                  aria-label={`Step ${x.n}: ${x.t}`}
                  onClick={() => go(i)}
                  onPointerMove={onMove}
                >
                  <span className="hw-tile" ref={(el) => void (tiles.current[i] = el)} aria-hidden="true">
                    <span className="hw-tile__float">
                      <span className="hw-tile__cap">
                        <i />
                      </span>
                      <span className="hw-tile__body">
                        <span className="hw-tile__spec" />
                        <span className="hw-tile__n">{x.n}</span>
                        <Micro k={x.vis} />
                      </span>
                    </span>
                    <span className="hw-tile__pool" />
                  </span>
                  <span className="hw-step__t">{x.t}</span>
                  <span className="hw-step__d">{x.d}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div id="hw-detail" className="hw-detail" aria-live="polite">
          <div className="hw-detail__main" key={active}>
            <p className="hw-detail__k">
              Step {s.n} <span>of 04</span>
            </p>
            <p className="hw-detail__t">{s.t}</p>
            <p className="hw-detail__d">{s.d}</p>
          </div>
          <ul className="hw-detail__chips" key={`c${active}`}>
            {s.chips.map((c, i) => (
              <li key={c} style={{ ['--i' as string]: i }}>
                <i aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
          <div className="hw-detail__dots" aria-hidden="true">
            {STEPS.map((x, i) => (
              <i key={x.n} className={i === active ? 'is-on' : i < active ? 'is-past' : ''} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
