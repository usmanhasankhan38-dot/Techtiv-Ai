import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { PREVIEW_MODE, useFinePointer, useReducedMotion } from '../../lib/env'
import './footer.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Every destination below exists on the live site's footer / nav today. */
const base = PREVIEW_MODE ? 'https://techtivai.vercel.app' : ''
const ext = PREVIEW_MODE ? { target: '_blank', rel: 'noopener' } : {}

const NAV = [
  { label: 'Analyze', href: '/analyze' },
  { label: 'AI Discovery', href: '/discovery' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Contact', href: '/contact' },
]
const INDUSTRIES = [
  { label: 'Real Estate', href: '/industries/real-estate' },
  { label: 'Healthcare', href: '/industries/healthcare' },
  { label: 'Ecommerce', href: '/industries/ecommerce' },
  { label: 'Law Firms', href: '/industries/law-firm' },
]
const WORD = 'TECHTIVAI'
/* optical pair adjustments (em) where the face has no kern pair: V/A diagonals */
const OPTICAL: Record<string, number> = { VA: -0.075 }

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg className="ft__arr" viewBox="0 0 12 12" aria-hidden="true">
      {up ? <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /> : <path d="M3 9 9 3M4 3h5v5" />}
    </svg>
  )
}

function LinkList({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <nav className="ft__col" aria-label={title}>
      <p className="ft__label">{title}</p>
      <ul>
        {items.map((l) => (
          <li key={l.href}>
            <a className="ft__link" href={`${base}${l.href}`} {...ext}>
              <span className="ft__link-t">{l.label}</span>
              <Arrow />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer() {
  const root = useRef<HTMLElement>(null)
  const word = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const fine = useFinePointer()

  /* fit the wordmark to the content width using the font's real ink box:
     side bearings trimmed so the letters sit optically flush with the grid */
  useEffect(() => {
    const el = word.current!
    const wrap = el.parentElement!
    const ctx = document.createElement('canvas').getContext('2d')!
    const fit = () => {
      const cw = wrap.clientWidth
      if (!cw) return
      const F = 200
      ctx.font = `700 ${F}px "Clash Display"`
      const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
      if ('letterSpacing' in c) c.letterSpacing = '0px'
      const spans = [...el.querySelectorAll<HTMLElement>('.ft__ch')]
      const w = (t: string) => ctx.measureText(t).width
      // restore the font's pair kerning, which separate spans would lose
      spans.forEach((sp, i) => {
        const nx = WORD[i + 1]
        const kern = nx ? w(WORD[i] + nx) - w(WORD[i]) - w(nx) : 0
        sp.style.marginRight = `${kern / F + (nx ? OPTICAL[WORD[i] + nx] ?? 0 : 0)}em`
      })
      el.style.fontSize = `${F}px`
      el.style.marginLeft = '0px'
      const box = el.getBoundingClientRect()
      const first = ctx.measureText(WORD[0])
      const last = ctx.measureText(WORD[WORD.length - 1])
      const r0 = spans[0].getBoundingClientRect()
      const rN = spans[spans.length - 1].getBoundingClientRect()
      const inkL = r0.left - box.left - first.actualBoundingBoxLeft
      const inkR = rN.left - box.left + last.actualBoundingBoxRight
      const k = cw / (inkR - inkL)
      const m = ctx.measureText(WORD)
      const asc = m.fontBoundingBoxAscent ?? F * 0.95
      const desc = m.fontBoundingBoxDescent ?? F * 0.25
      const cap = m.actualBoundingBoxAscent
      const baseline = (F - (asc + desc)) / 2 + asc // line-height: 1
      el.style.fontSize = `${F * k}px`
      el.style.marginLeft = `${-inkL * k}px`
      el.style.marginTop = `${-(baseline - cap) * k}px`
      wrap.style.height = `${(cap + F * 0.012) * k}px`
    }
    let raf = 0
    const run = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(fit)
    }
    run()
    document.fonts?.ready.then(run)
    const ro = new ResizeObserver(run)
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  /* very quiet pointer response: letters near the cursor warm toward lime */
  useEffect(() => {
    if (!fine || reduced) return
    const el = root.current!
    const letters = [...el.querySelectorAll<HTMLElement>('.ft__ch')]
    let raf = 0
    let px = -1e4
    let py = -1e4
    const paint = () => {
      raf = 0
      for (const l of letters) {
        const r = l.getBoundingClientRect()
        const dx = px - (r.left + r.width / 2)
        const dy = Math.max(0, Math.abs(py - (r.top + r.height / 2)) - r.height / 2)
        const d = Math.hypot(dx, dy * 1.4)
        const p = Math.max(0, 1 - d / Math.max(320, r.width * 2.4))
        l.style.setProperty('--p', (p * p).toFixed(3))
      }
    }
    const move = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const leave = () => {
      px = py = -1e4
      if (!raf) raf = requestAnimationFrame(paint)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [fine, reduced])

  useGSAP(
    () => {
      if (reduced) return
      const q = gsap.utils.selector(root)
      // A — editorial content enters once
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 78%', once: true } })
        .from(q('.ft__line > span'), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.08 })
        .from(q('.ft__pill'), { y: 14, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, '-=0.6')
        .from(q('.ft__col'), { y: 18, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.55')
        .from(q('.ft__col li'), { y: 10, autoAlpha: 0, duration: 0.5, ease: 'power3.out', stagger: 0.03 }, '<0.05')

      // B–D — wordmark letters rise through the mask, tied to scroll (reverses naturally)
      gsap.fromTo(
        q('.ft__ch'),
        { yPercent: 108 },
        {
          yPercent: 0,
          ease: 'none',
          stagger: { each: 0.06, from: 'start' },
          scrollTrigger: {
            trigger: q('.ft__mask')[0],
            start: 'top 125%',
            endTrigger: root.current,
            end: 'bottom 106%', // settles just before the page end, so no stray pixel leaves it unfinished
            scrub: 0.8,
          },
        },
      )
      gsap.fromTo(
        q('.ft__bar'),
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'bottom 118%', end: 'bottom 104%', scrub: 0.6 },
        },
      )
    },
    { scope: root, dependencies: [reduced] },
  )

  /* driven frame-by-frame (not native smooth scroll), so a ScrollTrigger
     refresh from lazy sections mid-journey can't cancel or strand it */
  const toTop = () => {
    const target = document.getElementById('hero-title')
    const land = () => {
      if (!target) return
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
    if (reduced) {
      window.scrollTo(0, 0)
      land()
      return
    }
    const st = { y: window.scrollY }
    gsap.killTweensOf(st)
    gsap.to(st, {
      y: 0,
      duration: Math.min(2.2, 0.9 + st.y / 20000),
      ease: 'power3.inOut',
      onUpdate: () => window.scrollTo(0, st.y),
      onComplete: land,
    })
  }

  return (
    <footer ref={root} className="ft" aria-labelledby="ft-title">
      <div className="ft__top">
        <div className="ft__lead">
          <h2 id="ft-title" className="ft__title">
            <span className="ft__line"><span>Let’s build</span></span>
            <span className="ft__line"><span>what comes next.</span></span>
          </h2>
          <div className="ft__pills">
            <a className="ft__pill" href={`${base}/contact`} {...ext} data-magnetic>
              Get in touch <Arrow />
            </a>
            <a className="ft__pill ft__pill--accent" href={`${base}/analyze`} {...ext} data-magnetic>
              Get my AI Blueprint <Arrow />
            </a>
          </div>
        </div>
        <div className="ft__nav">
          <LinkList title="Navigate" items={NAV} />
          <LinkList title="Industries" items={INDUSTRIES} />
        </div>
      </div>

      <div className="ft__mask">
        <div ref={word} className="ft__word" role="img" aria-label="TechtivAI">
          {WORD.split('').map((c, i) => (
            <span key={i} className="ft__ch" aria-hidden="true">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="ft__bar">
        <p className="ft__copy">© {new Date().getFullYear()} TechTivAI. All rights reserved.</p>
        <a className="ft__link ft__link--sm" href={`${base}/dashboard`} {...ext}>
          <span className="ft__link-t">Dashboard</span>
          <Arrow />
        </a>
        <button type="button" className="ft__top-btn" onClick={toTop}>
          Back to top <Arrow up />
        </button>
      </div>
    </footer>
  )
}
