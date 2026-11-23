import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { CATEGORIES, ROW_BOTTOM, ROW_TOP, TECH, type Category, type Tech } from './techData'
import { useReducedMotion } from '../../lib/env'
import { globeAnchors, sceneMotion } from '../../lib/store'
import { GlobeFallback } from '../GlobeLayer'
import { IconArrow, IconClose } from '../Icons'
import '../glass.css'
import './technology.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ---------------------------------------------------------------------------
   Logo tile
--------------------------------------------------------------------------- */
function LogoMark({ t, size = 'md' }: { t: Tech; size?: 'md' | 'sm' }) {
  if (t.logo) return <img className="logo-mark__img" src={t.logo} alt="" width={36} height={36} draggable={false} />
  return <span className={`logo-mark__text logo-mark__text--${size}`}>{t.mark}</span>
}

type Selected = { tech: Tech; key: string; row: 'top' | 'bottom'; el: HTMLElement }

/* ---------------------------------------------------------------------------
   One infinite stream. GSAP owns the transform; React never re-renders it
   per frame. The list is repeated enough times to cover the viewport twice.
--------------------------------------------------------------------------- */
function Stream({
  items,
  row,
  direction,
  pxPerSecond,
  selectedKey,
  onSelect,
  registerTween,
  onKeyboardFocus,
}: {
  items: Tech[]
  row: 'top' | 'bottom'
  direction: 'ltr' | 'rtl'
  pxPerSecond: number
  selectedKey: string | null
  onSelect: (t: Tech, key: string, row: 'top' | 'bottom', el: HTMLElement) => void
  registerTween: (row: 'top' | 'bottom', tw: gsap.core.Tween | null) => void
  onKeyboardFocus: (row: 'top' | 'bottom', el: HTMLElement) => void
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [copies, setCopies] = useState(3)

  // tile pitch is read from CSS so breakpoints stay in the stylesheet
  const measure = useCallback(() => {
    const tr = track.current
    if (!tr || !tr.firstElementChild) return null
    const first = tr.children[0] as HTMLElement
    const nextSet = tr.children[items.length] as HTMLElement | undefined
    const setW = nextSet ? nextSet.offsetLeft - first.offsetLeft : tr.scrollWidth / copies
    return setW
  }, [items.length, copies])

  useLayoutEffect(() => {
    const vp = viewport.current!
    let tween: gsap.core.Tween | null = null
    const build = () => {
      const setW = measure()
      if (!setW) return
      const need = Math.max(2, Math.ceil((vp.clientWidth * 1.2) / setW) + 1)
      if (need !== copies) {
        setCopies(need)
        return
      }
      const prevProgress = tween ? tween.progress() : 0
      const prevScale = tween ? tween.timeScale() : 1
      tween?.kill()
      const from = direction === 'rtl' ? 0 : -setW
      const to = direction === 'rtl' ? -setW : 0
      tween = gsap.fromTo(track.current, { x: from }, { x: to, duration: setW / pxPerSecond, ease: 'none', repeat: -1 })
      tween.progress(prevProgress).timeScale(prevScale)
      registerTween(row, tween)
    }
    build()
    const ro = new ResizeObserver(() => build())
    ro.observe(vp)
    return () => {
      ro.disconnect()
      tween?.kill()
      registerTween(row, null)
    }
  }, [copies, direction, measure, pxPerSecond, registerTween, row])

  const sets = useMemo(() => Array.from({ length: copies }, (_, c) => c), [copies])

  return (
    <div ref={viewport} className={`stream stream--${row}`}>
      <div ref={track} className="stream__track">
        {sets.map((c) =>
          items.map((t, i) => {
            const key = `${row}-${c}-${i}`
            // the second copy is the accessible one: the loop range can always bring it to the centre
            const primary = c === 1
            const isSel = selectedKey === key
            return (
              <button
                key={key}
                type="button"
                className={`tile ${isSel ? 'is-selected' : ''} ${t.logo ? '' : 'tile--text'}`}
                data-key={key}
                aria-label={`${t.name}: ${t.desc}`}
                aria-pressed={isSel}
                aria-hidden={primary ? undefined : true}
                tabIndex={primary ? 0 : -1}
                onClick={(e) => onSelect(t, key, row, e.currentTarget)}
                onFocus={(e) => {
                  if (primary && e.currentTarget.matches(':focus-visible')) onKeyboardFocus(row, e.currentTarget)
                }}
              >
                <span className="tile__face">
                  <LogoMark t={t} />
                </span>
                <span className="tile__name" aria-hidden="true">
                  {t.name}
                </span>
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Section
--------------------------------------------------------------------------- */
export default function Technology({ webgl }: { webgl: boolean }) {
  const root = useRef<HTMLElement>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const tweens = useRef<{ top: gsap.core.Tween | null; bottom: gsap.core.Tween | null }>({ top: null, bottom: null })
  const reduced = useReducedMotion()

  const [selected, setSelected] = useState<Selected | null>(null)
  const [userPaused, setUserPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [kbFocus, setKbFocus] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [cardPos, setCardPos] = useState<{ left: number; top: number; place: 'above' | 'below' } | null>(null)

  useEffect(() => {
    globeAnchors.tech = anchor.current
    return () => {
      globeAnchors.tech = null
    }
  }, [])

  const registerTween = useCallback((row: 'top' | 'bottom', tw: gsap.core.Tween | null) => {
    tweens.current[row] = tw
  }, [])

  /* ---- one place decides how fast the streams run ---- */
  const target = selected || userPaused || kbFocus ? 0 : hovering ? 0.32 : 1
  useEffect(() => {
    const list = [tweens.current.top, tweens.current.bottom].filter(Boolean) as gsap.core.Tween[]
    gsap.to(list, {
      timeScale: target,
      duration: target === 0 ? 0.22 : target === 1 ? 0.9 : 0.5,
      ease: target === 0 ? 'power3.out' : 'power2.inOut',
      overwrite: 'auto', // only timeScale — never cancel a focus slide on progress
    })
  }, [target])

  /* ---- selection ---- */
  const placeCard = useCallback((el: HTMLElement, row: 'top' | 'bottom') => {
    const st = stage.current
    if (!st) return
    const s = st.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const cardW = Math.min(300, s.width - 24)
    const left = Math.min(Math.max(r.left + r.width / 2 - s.left - cardW / 2, 12), s.width - cardW - 12)
    const top = row === 'top' ? r.top - s.top - 16 : r.bottom - s.top + 16
    setCardPos({ left, top, place: row === 'top' ? 'above' : 'below' })
  }, [])

  const onSelect = useCallback(
    (tech: Tech, key: string, row: 'top' | 'bottom', el: HTMLElement) => {
      setSelected((cur) => (cur?.key === key ? null : { tech, key, row, el }))
      placeCard(el, row)
      // the streams ease to a stop in ~0.2s; keep the card pinned while they settle
      window.setTimeout(() => placeCard(el, row), 240)
    },
    [placeCard],
  )

  const dismiss = useCallback((returnFocus = false) => {
    setSelected((cur) => {
      if (returnFocus && cur) cur.el.focus({ preventScroll: true })
      return null
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(true)
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('.tile') && !t.closest('.tech-card')) dismiss()
    }
    const onResize = () => dismiss()
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
    }
  }, [selected, dismiss])

  /* keyboard users: stop the streams and slide the focused logo into view */
  const onKeyboardFocus = useCallback((row: 'top' | 'bottom', el: HTMLElement) => {
    setKbFocus(true)
    const tw = tweens.current[row]
    const vp = el.closest('.stream') as HTMLElement | null
    const tr = el.parentElement
    if (!tw || !vp || !tr) return
    const vpW = vp.clientWidth
    const pitchSet = (tr.children[ROW_LEN[row]] as HTMLElement).offsetLeft - (tr.children[0] as HTMLElement).offsetLeft
    let x = vpW / 2 - (el.offsetLeft + el.offsetWidth / 2)
    while (x > 0) x -= pitchSet
    while (x < -pitchSet) x += pitchSet
    const dir = row === 'top' ? 'ltr' : 'rtl'
    const p = dir === 'rtl' ? -x / pitchSet : (x + pitchSet) / pitchSet
    gsap.to(tw, { progress: p, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
  }, [])

  /* ---- scroll: globe hand-off + entrance ---- */
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
      if (reduced) return
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
      gsap.from(q('.stream--top'), { xPercent: -6, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: q('.tech__stage')[0], start: 'top 75%' } })
      gsap.from(q('.stream--bottom'), { xPercent: 6, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: q('.tech__stage')[0], start: 'top 75%' } })
      gsap.from(q('.tech__actions'), { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: q('.tech__stage')[0], start: 'top 55%' } })
    },
    { scope: root, dependencies: [reduced] },
  )

  const shown = filter === 'All' ? TECH : TECH.filter((t) => t.category === filter)

  return (
    <section
      ref={root}
      id="technology"
      className={`tech ${selected ? 'has-selection' : ''} ${reduced ? 'is-static' : ''}`}
      aria-labelledby="tech-title"
      tabIndex={-1}
    >
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

      <div ref={stage} className="tech__stage">
        <div ref={anchor} className="globe-anchor tech__globe-anchor" aria-hidden="true">
          {!webgl && <GlobeFallback />}
        </div>

        {!reduced && (
          <div
            className="tech__streams"
            role="group"
            aria-label="Technology streams — select a logo to learn more"
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setKbFocus(false)
            }}
          >
            <Stream items={ROW_TOP} row="top" direction="ltr" pxPerSecond={34} selectedKey={selected?.key ?? null} onSelect={onSelect} registerTween={registerTween} onKeyboardFocus={onKeyboardFocus} />
            <Stream items={ROW_BOTTOM} row="bottom" direction="rtl" pxPerSecond={30} selectedKey={selected?.key ?? null} onSelect={onSelect} registerTween={registerTween} onKeyboardFocus={onKeyboardFocus} />
          </div>
        )}

        <div
          ref={card}
          className={`tech-card glass ${selected && cardPos ? 'is-on' : ''} tech-card--${cardPos?.place ?? 'above'}`}
          style={cardPos ? { left: cardPos.left, top: cardPos.top } : undefined}
          role="status"
          aria-live="polite"
        >
          {selected && (
            <>
              <div className="tech-card__logo" aria-hidden="true">
                <LogoMark t={selected.tech} size="sm" />
              </div>
              <div className="tech-card__body">
                <p className="tech-card__cat">{selected.tech.category}</p>
                <p className="tech-card__name">{selected.tech.name}</p>
                <p className="tech-card__desc">{selected.tech.desc}</p>
                {selected.tech.maker && <p className="tech-card__note">Shown with the {selected.tech.maker}</p>}
                {!selected.tech.logo && <p className="tech-card__note">Text label · official logo not included</p>}
              </div>
              <button type="button" className="tech-card__close" onClick={() => dismiss(true)} aria-label={`Close ${selected.tech.name} and resume`}>
                <IconClose />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tech__actions">
        <button
          type="button"
          className="btn btn--ghost"
          aria-expanded={exploreOpen || reduced}
          aria-controls="tech-explore"
          onClick={() => setExploreOpen((v) => !v)}
          disabled={reduced}
          data-magnetic
        >
          {exploreOpen || reduced ? 'Hide full list' : 'Explore all technologies'} <IconArrow />
        </button>
        {!reduced && (
          <button type="button" className="tech__motion-toggle" aria-pressed={userPaused} onClick={() => setUserPaused((v) => !v)}>
            <span className={`tech__motion-icon ${userPaused ? 'is-paused' : ''}`} aria-hidden="true" />
            {userPaused ? 'Play streams' : 'Pause streams'}
          </button>
        )}
        {selected && (
          <button type="button" className="tech__resume" onClick={() => dismiss(true)}>
            Resume
          </button>
        )}
      </div>

      <div id="tech-explore" className={`tech__explore glass ${exploreOpen || reduced ? 'is-open' : ''}`} hidden={!(exploreOpen || reduced)}>
        <div className="tech__filters" role="group" aria-label="Filter technologies">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        <ul className="tech__grid">
          {shown.map((t) => (
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
      </div>
    </section>
  )
}

const ROW_LEN = { top: ROW_TOP.length, bottom: ROW_BOTTOM.length }
