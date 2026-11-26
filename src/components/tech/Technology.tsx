import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { CATEGORIES, TECH, type Category, type Tech } from './techData'
import { useReducedMotion } from '../../lib/env'
import { globeAnchors, sceneMotion, techGlobe } from '../../lib/store'
import { GlobeFallback } from '../GlobeLayer'
import { IconArrow, IconClose } from '../Icons'
import '../glass.css'
import './technology.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ---------------------------------------------------------------------------
   Logo
--------------------------------------------------------------------------- */
function LogoMark({ t, size = 'md' }: { t: Tech; size?: 'md' | 'sm' }) {
  if (t.logo) return <img className="logo-mark__img" src={t.logo} alt="" width={36} height={36} draggable={false} />
  return <span className={`logo-mark__text logo-mark__text--${size}`}>{t.mark}</span>
}

type Via = 'hover' | 'pin' | 'focus'

/* ---------------------------------------------------------------------------
   Section — V3: the globe is the interface. 30 hotspots on the globe (one per
   technology) replace the two logo streams. Hover (mouse), tap (touch) or the
   accessible index opens one popup at a time; drag turns the globe freely.
   Per-frame data moves through `techGlobe` (lib/store) — no React renders on
   pointer movement; React renders only when the open technology changes.
--------------------------------------------------------------------------- */
export default function Technology({ webgl }: { webgl: boolean }) {
  const root = useRef<HTMLElement>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const linePath = useRef<SVGPathElement>(null)
  const lineDot = useRef<SVGCircleElement>(null)
  const reduced = useReducedMotion()

  const [active, setActive] = useState(-1)
  const [seq, setSeq] = useState(0) // bumps on every open, so a re-open always replays the reveal
  const [via, setVia] = useState<Via>('hover')
  const [indexOpen, setIndexOpen] = useState(false)
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [touched, setTouched] = useState(false)

  const st = useRef({
    active: -1,
    via: 'hover' as Via,
    overPop: false,
    closeT: 0,
    lastAns: 0,
    inView: false,
    down: null as null | { id: number; x: number; y: number; lx: number; ly: number; moved: boolean; touch: boolean },
  })
  const tl = useRef<gsap.core.Timeline | null>(null)
  const outTl = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    globeAnchors.tech = anchor.current
    return () => {
      globeAnchors.tech = null
    }
  }, [])

  /* ---------------- open / close (one popup at a time) ---------------- */
  const open = useCallback((i: number, how: Via) => {
    const s = st.current
    window.clearTimeout(s.closeT)
    s.closeT = 0
    if (s.active === i) {
      // a click or keyboard focus upgrades a hover popup so it stays
      if (how !== 'hover' && s.via === 'hover') {
        s.via = how
        setVia(how)
      }
      return
    }
    outTl.current?.kill()
    s.active = i
    s.via = how
    techGlobe.active = i
    techGlobe.facing = 1 // the scene refreshes this on its next frame
    setActive(i)
    setVia(how)
    setSeq((n) => n + 1)
    techGlobe.invalidate?.()
  }, [])

  const close = useCallback(() => {
    const s = st.current
    window.clearTimeout(s.closeT)
    s.closeT = 0
    if (s.active < 0) return
    s.active = -1
    techGlobe.active = -1
    techGlobe.invalidate?.()
    tl.current?.kill()
    const p = pop.current
    const done = () => {
      if (st.current.active < 0) setActive(-1)
    }
    if (!p || reduced) return done()
    outTl.current = gsap
      .timeline({ onComplete: done })
      .to(p.querySelectorAll('.tp__line > span'), { yPercent: -110, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, 0)
      .to(p, { clipPath: 'inset(0% 50% 0% 50% round 16px)', autoAlpha: 0, duration: 0.34, ease: 'power3.in' }, 0.06)
      .to(linePath.current, { strokeDashoffset: 1, duration: 0.3, ease: 'power2.in' }, 0.1)
      .to(lineDot.current, { scale: 0, duration: 0.2, ease: 'power2.in', transformOrigin: 'center' }, 0.1)
  }, [reduced])

  const scheduleClose = useCallback(
    (ms = 260) => {
      const s = st.current
      if (s.closeT) return
      s.closeT = window.setTimeout(() => {
        st.current.closeT = 0
        close()
      }, ms)
    },
    [close],
  )

  /* ---------------- popup choreography (GSAP) ---------------- */
  useLayoutEffect(() => {
    if (active < 0 || !pop.current) return
    const p = pop.current
    tl.current?.kill()
    if (reduced) {
      gsap.set(p, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)' })
      gsap.set(linePath.current, { strokeDashoffset: 0 })
      return
    }
    tl.current = gsap
      .timeline()
      .fromTo(linePath.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, 0)
      .fromTo(lineDot.current, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', transformOrigin: 'center' }, 0.3)
      .fromTo(p, { autoAlpha: 1, clipPath: 'inset(0% 50% 0% 50% round 16px)', y: 6, scale: 0.97 }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', y: 0, scale: 1, duration: 0.6, ease: 'expo.out' }, 0.16)
      .fromTo(p.querySelector('.tp__edge'), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'expo.out' }, 0.26)
      .fromTo(p.querySelector('.tp__logo'), { scale: 0.6, rotate: -10, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.55, ease: 'back.out(2)' }, 0.28)
      .fromTo(p.querySelectorAll('.tp__line > span'), { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: 'expo.out', stagger: 0.06 }, 0.34)
  }, [seq, reduced])

  /* ---------------- frame loop: hover intent, pick answers, placement ---------------- */
  useEffect(() => {
    const el = root.current!
    const io = new IntersectionObserver(([e]) => (st.current.inView = e.isIntersecting))
    io.observe(el)
    const tick = () => {
      const s = st.current
      const tg = techGlobe
      if (!s.inView) {
        if (s.active >= 0) close()
        return
      }
      // mouse hover: the hotspot under the pointer opens; leaving starts a short grace
      if (tg.mouse) {
        if (tg.hover >= 0 && tg.hover !== s.active) open(tg.hover, 'hover')
        else if (tg.hover >= 0) {
          window.clearTimeout(s.closeT)
          s.closeT = 0
        } else if (s.active >= 0 && s.via === 'hover' && !s.overPop) scheduleClose()
      }
      // click / tap answers from the scene's raycast
      if (tg.pickAns.id !== s.lastAns) {
        s.lastAns = tg.pickAns.id
        if (tg.pickAns.idx >= 0) open(tg.pickAns.idx, 'pin')
        else close()
      }
      if (s.active < 0 || !pop.current) return
      // the open hotspot turned away (manual drag): close
      if (tg.facing < 0.12 && s.via !== 'focus') {
        close()
        return
      }
      // placement: beside the hotspot, on its outward side, always inside the viewport
      const p = pop.current
      const vw = window.innerWidth
      const vh = window.innerHeight
      const pw = p.offsetWidth
      const ph = p.offsetHeight
      const x = tg.sx
      const y = tg.sy
      const narrow = vw < 768
      let left: number
      let top: number
      let ex: number
      let ey: number
      let mx: number
      let my: number
      if (!narrow) {
        let dir = x >= tg.cx ? 1 : -1
        const gap = 70
        if (dir > 0 && x + gap + pw > vw - 12) dir = -1
        else if (dir < 0 && x - gap - pw < 12) dir = 1
        left = dir > 0 ? x + gap : x - gap - pw
        top = Math.min(Math.max(y - ph / 2, 84), vh - ph - 12)
        left = Math.min(Math.max(left, 12), vw - pw - 12)
        ex = dir > 0 ? left : left + pw
        ey = Math.min(Math.max(y, top + 18), top + ph - 18)
        mx = x + dir * 22
        my = y
      } else {
        const below = y < tg.cy
        top = below ? y + 46 : y - 46 - ph
        top = Math.min(Math.max(top, 76), vh - ph - 12)
        left = Math.min(Math.max(x - pw / 2, 12), vw - pw - 12)
        ex = Math.min(Math.max(x, left + 18), left + pw - 18)
        ey = below ? top : top + ph
        mx = x
        my = y + (below ? 18 : -18)
      }
      // left/top (not transform): GSAP owns the popup's transform for its reveal
      p.style.left = `${left.toFixed(1)}px`
      p.style.top = `${top.toFixed(1)}px`
      linePath.current?.setAttribute('d', `M${x.toFixed(1)},${y.toFixed(1)} L${mx.toFixed(1)},${my.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`)
      lineDot.current?.setAttribute('cx', ex.toFixed(1))
      lineDot.current?.setAttribute('cy', ey.toFixed(1))
      if (reduced) tg.invalidate?.()
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
    }
  }, [open, close, scheduleClose, reduced])

  /* ---------------- dismissal: outside press, Escape ---------------- */
  useEffect(() => {
    if (active < 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('.tp') || t.closest('.tech__globe-anchor') || t.closest('.tech__index')) return
      close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [active, close])

  /* ---------------- globe gestures (drag · tap · hover) ---------------- */
  const onPointerEnter = (e: React.PointerEvent) => {
    techGlobe.mouse = e.pointerType === 'mouse'
    if (techGlobe.mouse) techGlobe.overGlobe = true
  }
  const onPointerLeave = () => {
    techGlobe.overGlobe = false
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    techGlobe.mouse = e.pointerType === 'mouse'
    st.current.down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, touch: e.pointerType !== 'mouse' }
    if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = st.current.down
    if (d && d.id === e.pointerId) {
      const dx = e.clientX - d.lx
      const dy = e.clientY - d.ly
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) {
        // touch: vertical swipes stay page scrolling (touch-action: pan-y)
        if (d.touch && Math.abs(e.clientY - d.y) > Math.abs(e.clientX - d.x)) {
          st.current.down = null
          return
        }
        d.moved = true
        techGlobe.dragging = true
        if (!d.touch) e.currentTarget.setPointerCapture(e.pointerId)
        if (st.current.via === 'hover') close()
        setTouched(true)
      }
      if (d.moved) {
        techGlobe.dragDX += dx
        techGlobe.dragDY += d.touch ? 0 : dy
      }
      d.lx = e.clientX
      d.ly = e.clientY
    }
    if (reduced || techGlobe.dragging) techGlobe.invalidate?.()
  }
  const endPointer = (e: React.PointerEvent, cancelled = false) => {
    const d = st.current.down
    if (!d || d.id !== e.pointerId) return
    if (!d.moved && !cancelled) {
      // tap / click: ask the scene which hotspot (if any) is under it
      techGlobe.pick = { x: e.clientX, y: e.clientY, id: techGlobe.pick.id + 1 }
      techGlobe.invalidate?.()
      setTouched(true)
    }
    techGlobe.dragging = false
    st.current.down = null
  }

  /* ---------------- accessible index: focus / click turns the globe ---------------- */
  const showFromIndex = (i: number) => {
    techGlobe.focusReq = i
    techGlobe.invalidate?.()
    open(i, 'focus')
  }

  /* ---------------- scroll: globe hand-off (unchanged) + entrance ---------------- */
  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'top 12%',
        scrub: 0.6,
        onUpdate: (self) => {
          sceneMotion.handoff = self.progress
        },
        onLeaveBack: () => {
          sceneMotion.handoff = 0
        },
      })
      // one scrubbed progress for the whole journey: hero top → globe settled in Technology
      ScrollTrigger.create({
        trigger: document.querySelector('.hero'),
        start: 'top top',
        endTrigger: root.current,
        end: 'top 12%',
        scrub: 0.8,
        onUpdate: (self) => {
          sceneMotion.zoom = reduced ? 0 : self.progress
        },
        onLeaveBack: () => {
          sceneMotion.zoom = 0
        },
      })
      if (reduced) {
        techGlobe.intro = 1
        return
      }
      gsap.from(q('.tech__line > span'), {
        yPercent: 115,
        rotate: 2,
        duration: 1.1,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 62%' },
      })
      gsap.from(q('.tech__eyebrow, .tech__sub'), {
        y: 16,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 62%' },
      })
      // hotspots arrive once the globe has settled, in a lattice-order stagger
      techGlobe.intro = 0
      ScrollTrigger.create({
        trigger: q('.tech__stage')[0],
        start: 'top 45%',
        once: true,
        onEnter: () => {
          gsap.to(techGlobe, { intro: 1, duration: 1.9, ease: 'power2.out', delay: 0.15 })
          gsap.fromTo(q('.tech__hint'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, delay: 1.1, ease: 'power3.out' })
        },
      })
      gsap.from(q('.tech__actions'), { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: q('.tech__stage')[0], start: 'top 55%' } })
    },
    { scope: root, dependencies: [reduced] },
  )

  const tech = active >= 0 ? TECH[active] : null
  const shown = filter === 'All' ? TECH.map((t, i) => [t, i] as const) : TECH.map((t, i) => [t, i] as const).filter(([t]) => t.category === filter)

  return (
    <section ref={root} id="technology" className={`tech ${reduced ? 'is-static' : ''} ${webgl ? '' : 'tech--flat'}`} aria-labelledby="tech-title" tabIndex={-1}>
      <header className="tech__head">
        <p className="tech__eyebrow">
          <span className="tech__eyebrow-dot" aria-hidden="true" />
          Technology
        </p>
        <h2 id="tech-title" className="tech__title">
          <span className="tech__line"><span>The Intelligence Behind</span></span>
          <span className="tech__line tech__line--accent"><span>Everything We Build.</span></span>
        </h2>
        <p className="tech__sub">
          Explore the technologies powering our AI agents, intelligent automation, and digital experiences.
        </p>
      </header>

      <div className="tech__stage">
        {/* the globe's frame — also the gesture surface (drag to turn, hover or tap a point) */}
        <div
          ref={anchor}
          className={`globe-anchor tech__globe-anchor ${webgl ? 'is-interactive' : ''}`}
          aria-hidden="true"
          onPointerEnter={webgl ? onPointerEnter : undefined}
          onPointerLeave={webgl ? onPointerLeave : undefined}
          onPointerDown={webgl ? onPointerDown : undefined}
          onPointerMove={webgl ? onPointerMove : undefined}
          onPointerUp={webgl ? (e) => endPointer(e) : undefined}
          onPointerCancel={webgl ? (e) => endPointer(e, true) : undefined}
        >
          {!webgl && <GlobeFallback />}
        </div>
        {webgl && (
          <p className={`tech__hint ${touched ? 'is-done' : ''}`} aria-hidden="true">
            <span className="tech__hint-ico" />
            <span className="tech__hint-mouse">Drag to turn the globe · hover a point</span>
            <span className="tech__hint-touch">Swipe to turn · tap a point</span>
          </p>
        )}
      </div>

      {/* connection line + popup: fixed overlay, positioned every frame from the hotspot's 3D position */}
      {webgl && (
        <svg className={`tp-line ${tech ? 'is-on' : ''}`} aria-hidden="true">
          <path ref={linePath} pathLength={1} d="M0,0" />
          <circle ref={lineDot} r="3" cx="0" cy="0" />
        </svg>
      )}
      {webgl && (
        <div
          ref={pop}
          className={`tp ${tech ? 'is-on' : ''} tp--${via}`}
          role="status"
          aria-live="polite"
          onPointerEnter={() => {
            st.current.overPop = true
            window.clearTimeout(st.current.closeT)
            st.current.closeT = 0
          }}
          onPointerLeave={() => {
            st.current.overPop = false
            if (st.current.via === 'hover') scheduleClose(220)
          }}
        >
          {tech && (
            <>
              <span className="tp__edge" aria-hidden="true" />
              <div className="tp__logo" aria-hidden="true">
                <LogoMark t={tech} size="sm" />
              </div>
              <div className="tp__body">
                <p className="tp__line tp__cat"><span>{tech.category}</span></p>
                <p className="tp__line tp__name"><span>{tech.name}</span></p>
                <p className="tp__line tp__desc"><span>{tech.desc}</span></p>
              </div>
              {via !== 'hover' && (
                <button type="button" className="tp__close" onClick={close} aria-label={`Close ${tech.name}`}>
                  <IconClose />
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="tech__actions">
        <button
          type="button"
          className="btn btn--ghost"
          aria-expanded={indexOpen || !webgl}
          aria-controls="tech-explore"
          onClick={() => setIndexOpen((v) => !v)}
          disabled={!webgl}
          data-magnetic
        >
          {indexOpen || !webgl ? 'Hide technology index' : 'Browse all technologies'} <IconArrow />
        </button>
      </div>

      {/* accessible explorer: every technology by name; focus or click turns the globe to it.
          Without WebGL it falls back to the full list with logos. */}
      <div id="tech-explore" className={`tech__explore glass ${indexOpen || !webgl ? 'is-open' : ''}`} hidden={!(indexOpen || !webgl)}>
        <div className="tech__filters" role="group" aria-label="Filter technologies">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        {webgl ? (
          <ul className="tech__index" aria-label="Technologies on the globe">
            {shown.map(([t, i]) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`tech__index-btn ${active === i ? 'is-on' : ''}`}
                  aria-label={`${t.name}: ${t.desc}`}
                  aria-pressed={active === i}
                  onFocus={() => showFromIndex(i)}
                  onClick={() => showFromIndex(i)}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="tech__grid">
            {shown.map(([t]) => (
              <li key={t.id} className={`tech__item ${t.logo ? '' : 'tech__item--text'}`}>
                <span className="tech__item-logo" aria-hidden="true">
                  <LogoMark t={t} size="sm" />
                </span>
                <span className="tech__item-text">
                  <span className="tech__item-name">{t.name}</span>
                  <span className="tech__item-desc">{t.desc}</span>
                </span>
                <span className="tech__item-tag">{t.tag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
