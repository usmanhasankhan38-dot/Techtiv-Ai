import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { PREVIEW_MODE, useReducedMotion } from '../../lib/env'
import './pricing.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   Pricing — three plans, verbatim from the live section.
   Terms shown exactly as the live site states them everywhere else: the
   first blueprint is free; each later website is a $5 one-time payment.
   The card silhouette (incl. the notch) is one measured path used twice:
   as a CSS clip for the material and as an SVG stroke for the edge, so the
   border runs continuously around the notch at every size.
   ========================================================================== */
const base = PREVIEW_MODE ? 'https://techtivai.vercel.app' : ''
const ext = PREVIEW_MODE ? { target: '_blank', rel: 'noopener' } : {}

type Plan = {
  id: 'blueprint' | 'impl' | 'advisory'
  name: string
  price: string
  priceNote?: string
  terms?: string
  desc: string
  features: { t: string; upcoming?: boolean }[]
  cta: string
  href: string
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'blueprint',
    name: 'AI Blueprint',
    price: 'Free',
    priceNote: 'first blueprint',
    terms: '$5 one-time for each later website',
    desc: 'First blueprint is free. Each later website is a one-time payment before research starts.',
    features: [{ t: 'Business & tech analysis' }, { t: 'Problems & opportunities' }, { t: 'Recommended TechTivAI services' }, { t: 'Implementation roadmap' }, { t: 'ROI / impact view' }],
    cta: 'Get My AI Blueprint',
    href: `${base}/analyze`,
    featured: true,
  },
  {
    id: 'impl',
    name: 'Implementation',
    price: 'Custom',
    priceNote: 'scoped per project',
    desc: 'Build the recommended agents, automation, web, or app.',
    features: [{ t: 'Scoped from your blueprint' }, { t: 'Clear timeline & stack' }, { t: '“Build This With TechTivAI” CTA' }, { t: 'Dedicated delivery team' }],
    cta: 'Request implementation',
    href: `${base}/contact`,
  },
  {
    id: 'advisory',
    name: 'Advisory',
    price: 'Monthly',
    priceNote: 'ongoing',
    desc: 'Ongoing consultant access and blueprint updates.',
    features: [{ t: 'AI Consultant access' }, { t: 'New recommendations' }, { t: 'Blueprint updates' }, { t: 'Voice consultation', upcoming: true }],
    cta: 'Start with blueprint',
    href: `${base}/analyze`,
  },
]

/* one icon family: 24 grid, 1.6 stroke, rounded joins */
function PlanIcon({ id }: { id: Plan['id'] }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {id === 'blueprint' && (
        <>
          <path d="M6.5 3.5h7l4 4v13h-11z" />
          <path d="M13.5 3.5v4h4" />
          <path d="M9 12h6M9 15h6M9 18h3.5" />
        </>
      )}
      {id === 'impl' && (
        <>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
          <path d="M10.5 7h3.5a3 3 0 0 1 3 3v3.5" />
          <path d="M3.5 17h3a3 3 0 0 0 3-3v-.5" />
          <circle cx="17" cy="7" r="2" />
        </>
      )}
      {id === 'advisory' && (
        <>
          <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H12l-4.5 3.5V16h-1a2 2 0 0 1-2-2z" />
          <path d="M12 7.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
        </>
      )}
    </svg>
  )
}

/* card silhouette: rounded rect, optionally with an inverted step (notch) top-right */
function shape(w: number, h: number, notch: { w: number; h: number } | null) {
  const R = 26
  const f = (n: number) => n.toFixed(1)
  if (!notch) {
    return `M${R},0 H${f(w - R)} A${R},${R} 0 0 1 ${f(w)},${R} V${f(h - R)} A${R},${R} 0 0 1 ${f(w - R)},${f(h)} H${R} A${R},${R} 0 0 1 0,${f(h - R)} V${R} A${R},${R} 0 0 1 ${R},0 Z`
  }
  const r = 14
  const nx = w - notch.w
  const ny = notch.h
  return [
    `M${R},0`,
    `H${f(nx - r)}`,
    `A${r},${r} 0 0 1 ${f(nx)},${r}`, // top edge turns down into the notch
    `V${f(ny - r)}`,
    `A${r},${r} 0 0 0 ${f(nx + r)},${f(ny)}`, // concave inner corner
    `H${f(w - R)}`,
    `A${R},${R} 0 0 1 ${f(w)},${f(ny + R)}`,
    `V${f(h - R)}`,
    `A${R},${R} 0 0 1 ${f(w - R)},${f(h)}`,
    `H${R}`,
    `A${R},${R} 0 0 1 0,${f(h - R)}`,
    `V${R}`,
    `A${R},${R} 0 0 1 ${R},0 Z`,
  ].join(' ')
}

function PlanCard({ p, live, lit }: { p: Plan; live: boolean; lit: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [geo, setGeo] = useState<{ w: number; h: number; d: string } | null>(null)
  const NOTCH = { w: 126, h: 40 }

  useLayoutEffect(() => {
    const el = ref.current!
    const measure = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      setGeo((g) => (g && g.w === w && g.h === h ? g : { w, h, d: shape(w, h, p.featured ? NOTCH : null) }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.featured])

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!live || e.pointerType !== 'mouse') return
    const r = ref.current!.getBoundingClientRect()
    ref.current!.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    ref.current!.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  }

  const clip = geo ? { clipPath: `path("${geo.d}")` } : undefined
  return (
    <article ref={ref} className={`pc pc--${p.id} ${p.featured ? 'pc--featured' : ''} ${p.featured && lit ? 'is-lit' : ''}`} onPointerMove={onMove} aria-labelledby={`pc-${p.id}`}>
      <span className="pc__bg" style={clip} aria-hidden="true">
        <span className="pc__glow" />
        <span className="pc__ref" />
      </span>
      {geo && (
        <svg className="pc__edge" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
          <defs>
            <linearGradient id={`pc-stroke-${p.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.featured ? '#c6ff00' : '#e8fff5'} stopOpacity={p.featured ? 0.75 : 0.16} />
              <stop offset="0.5" stopColor={p.featured ? '#c6ff00' : '#e8fff5'} stopOpacity={p.featured ? 0.22 : 0.07} />
              <stop offset="1" stopColor={p.featured ? '#c6ff00' : '#3de8ff'} stopOpacity={p.featured ? 0.55 : 0.2} />
            </linearGradient>
          </defs>
          <path d={geo.d} className="pc__line" stroke={`url(#pc-stroke-${p.id})`} />
          <path d={geo.d} className="pc__line pc__line--hover" />
        </svg>
      )}
      {p.featured && (
        <span className="pc__tag" style={{ width: NOTCH.w, height: NOTCH.h }}>
          Start here
        </span>
      )}

      <header className="pc__head">
        <span className="pc__ic">
          <PlanIcon id={p.id} />
        </span>
        <h3 id={`pc-${p.id}`}>{p.name}</h3>
      </header>

      <div className="pc__price">
        <p>
          <b>{p.price}</b>
          {p.priceNote && <span>{p.priceNote}</span>}
        </p>
        {p.terms && <p className="pc__terms">{p.terms}</p>}
      </div>

      <p className="pc__desc">{p.desc}</p>

      <a className={`pc__cta ${p.featured ? 'pc__cta--primary' : ''}`} href={p.href} {...ext} data-magnetic={p.featured ? '' : undefined}>
        <span>{p.cta}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
        </svg>
      </a>

      <div className="pc__feat">
        <p className="pc__feat-k">Features included</p>
        <ul>
          {p.features.map((f) => (
            <li key={f.t} className={f.upcoming ? 'is-upcoming' : ''}>
              {f.upcoming ? (
                <span className="pc__mk pc__mk--soon" aria-hidden="true" />
              ) : (
                <svg className="pc__mk" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="m3.5 8.4 2.9 2.9 6-6.4" />
                </svg>
              )}
              {f.t}
              {f.upcoming && <em>Upcoming</em>}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default function Pricing() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  const [lit, setLit] = useState(false)
  useLayoutEffect(() => {
    if (!live) setLit(true)
  }, [live])

  useGSAP(
    () => {
      if (!live) return
      const q = gsap.utils.selector(root)
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.pr__eyebrow'), { y: 12, opacity: 0, duration: 0.6 })
        .from(q('.pr__line > span'), { yPercent: 110, duration: 1, stagger: 0.09, ease: 'expo.out' }, 0.08)
        .from(q('.pr__desc'), { y: 14, opacity: 0, duration: 0.7 }, 0.4)
      gsap
        .timeline({ scrollTrigger: { trigger: q('.pr__grid')[0], start: 'top 82%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.pc'), { y: 26, opacity: 0, duration: 0.7, stagger: 0.12, clearProps: 'transform,opacity' })
        .from(q('.pc__glow'), { opacity: 0, duration: 1.1, stagger: 0.12 }, 0.2)
        .add(() => setLit(true), 0.9)
    },
    { scope: root, dependencies: [live] },
  )

  return (
    <section ref={root} id="pricing" className={`pr ${live ? '' : 'is-static'}`} aria-labelledby="pr-title">
      <div className="pr__inner">
        <header className="pr__head">
          <p className="pr__eyebrow">
            <span aria-hidden="true" />
            Pricing
          </p>
          <h2 id="pr-title" className="pr__title">
            <span className="pr__line">
              <span>Start with a $5 Blueprint.</span>
            </span>
            <span className="pr__line pr__line--accent">
              <span>Scale into delivery.</span>
            </span>
          </h2>
          <p className="pr__desc">Entry product first. Implementation and ongoing advisory when you’re ready.</p>
        </header>
        <div className="pr__grid">
          {PLANS.map((p) => (
            <PlanCard key={p.id} p={p} live={live} lit={lit} />
          ))}
        </div>
      </div>
    </section>
  )
}
