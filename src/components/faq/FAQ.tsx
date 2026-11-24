import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from '../../lib/env'
import './faq.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ==========================================================================
   FAQ — questions and answers verbatim from the live section.
   Ownership: GSAP plays the one-time entrance (opacity/transform of the
   cards' wrappers); React state owns open/closed; CSS animates the answer
   height (grid rows 0fr → 1fr, so any length opens to its natural height),
   the icon and the lighting. No two systems touch the same property.
   ========================================================================== */
const QA = [
  {
    q: 'What is the AI Blueprint?',
    a: 'A personalized strategy report that analyzes your business, technology, and opportunities, then recommends specific AI, automation, web/app, and TechTivAI services with timelines.',
  },
  {
    q: 'When do I pay?',
    a: 'The first blueprint is free, including the PDF. A later new website is a one-time payment before we start that analysis. The same website we already analyzed is not charged again.',
  },
  {
    q: 'Do I need a website to start?',
    a: 'A website helps, but you can also share social profile links. We research whatever public footprint you provide, then ask clarifying questions.',
  },
  {
    q: 'What happens after I get the blueprint?',
    a: 'You can request any recommended service with “Build This With TechTivAI.” Our team follows up for consultation, proposal, and delivery.',
  },
  {
    q: 'Is there a human consultant too?',
    a: 'Yes. The AI Consultant handles discovery and recommendations. High-ticket builds are delivered by TechTivAI’s implementation team.',
  },
]

export default function FAQ() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced
  const [open, setOpen] = useState<boolean[]>(() => QA.map(() => false))

  useGSAP(
    () => {
      if (!live) return
      const q = gsap.utils.selector(root)
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true }, defaults: { ease: 'power3.out' } })
        .from(q('.fq__eyebrow'), { y: 12, opacity: 0, duration: 0.6 })
        .from(q('.fq__line > span'), { yPercent: 110, duration: 1, stagger: 0.09, ease: 'expo.out' }, 0.08)
        .from(q('.fq__desc'), { y: 16, opacity: 0, duration: 0.7 }, 0.35)
        .from(q('.fq-item'), { y: 24, opacity: 0, duration: 0.7, stagger: 0.09, clearProps: 'transform,opacity' }, 0.45)
        .from(q('.fq-card__light'), { opacity: 0, duration: 1.2, stagger: 0.09 }, 0.7)
    },
    { scope: root, dependencies: [live] },
  )

  const toggle = (i: number) => setOpen((o) => o.map((v, k) => (k === i ? !v : v)))
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!live || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  }

  return (
    <section ref={root} id="faq" className="fq" aria-labelledby="fq-title">
      <header className="fq__head">
        <p className="fq__eyebrow">
          <span aria-hidden="true" />
          FAQ
        </p>
        <h2 id="fq-title" className="fq__title">
          <span className="fq__line">
            <span>Questions before</span>
          </span>
          <span className="fq__line fq__line--accent">
            <span>you start</span>
          </span>
        </h2>
        <p className="fq__desc">Everything you need to know about your AI Blueprint, our process, and what comes next.</p>
      </header>

      <ul className="fq__list">
        {QA.map((x, i) => {
          const on = open[i]
          return (
            <li key={x.q} className="fq-item">
              <div className={`fq-card ${on ? 'is-open' : ''}`} onPointerMove={onMove}>
                <span className="fq-card__light" aria-hidden="true" />
                <span className="fq-card__ref" aria-hidden="true" />
                <h3 className="fq-card__h">
                  <button type="button" id={`fq-q${i}`} className="fq-card__q" aria-expanded={on} aria-controls={`fq-a${i}`} onClick={() => toggle(i)}>
                    <span className="fq-card__n" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="fq-card__t">{x.q}</span>
                    <span className="fq-card__ic" aria-hidden="true">
                      <i />
                      <i />
                    </span>
                  </button>
                </h3>
                <div id={`fq-a${i}`} role="region" aria-labelledby={`fq-q${i}`} className="fq-card__a" aria-hidden={!on}>
                  <div className="fq-card__clip">
                    <p>{x.a}</p>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
