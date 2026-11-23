import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { SCENARIOS } from './workflowData'
import WorkflowEngine from './WorkflowEngine'
import { Glyph } from '../glyphs'
import { useReducedMotion } from '../../lib/env'
import '../glass.css'
import './workflow.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const POINTS = ['Intelligent decision logic', 'Multi-system orchestration', 'Self-improving flows']

export default function Workflow() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const scenario = SCENARIOS[current]

  useGSAP(
    () => {
      if (reduced) return
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 68%' }, defaults: { ease: 'power3.out' } })
      tl.from(q('.wf__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.wf__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.wf__sub, .wf__points'), { y: 16, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.45)
        .from(q('.wf-card'), { y: 22, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.6)
        .from(q('.wf__panel'), { y: 40, opacity: 0, scale: 0.98, duration: 1.1 }, 0.3)
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section ref={root} id="workflow-automation" className="wf" aria-labelledby="wf-title">
      <div className="wf__inner">
        <div className="wf__copy">
          <p className="wf__eyebrow">
            <span className="wf__eyebrow-dot" aria-hidden="true" />
            Workflow Automation
          </p>
          <h2 id="wf-title" className="wf__title">
            <span className="wf__line"><span>Automate Any Process.</span></span>
            <span className="wf__line wf__line--accent"><span>Connect Everything.</span></span>
          </h2>
          <p className="wf__sub">
            From simple Zaps to complex multi-system orchestrations — our AI Workflow Engine automates it all with intelligent decision
            logic.
          </p>
          <ul className="wf__points">
            {POINTS.map((p) => (
              <li key={p}>
                <span className="wf__tick" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 12.5 4 4 8-9" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="wf__cards" role="group" aria-label="Choose an automation example">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`wf-card ${i === current ? 'is-selected' : ''}`}
                aria-pressed={i === current}
                aria-controls="wf-engine"
                onClick={() => setCurrent(i)}
              >
                <span className="wf-card__icon" aria-hidden="true">
                  <Glyph name={s.icon} size={20} />
                </span>
                <span className="wf-card__title">{s.title}</span>
                <span className="wf-card__desc">{s.desc}</span>
                <span className="wf-card__state" aria-hidden="true">
                  {i === current ? 'Showing' : 'Preview'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div id="wf-engine" className="wf__panel" aria-label={`Workflow example: ${scenario.title}`} role="region">
          <div className="wf__panel-glow" aria-hidden="true" />
          <WorkflowEngine scenario={scenario} reduced={reduced} />
        </div>
      </div>
    </section>
  )
}
