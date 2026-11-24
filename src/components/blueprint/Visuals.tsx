import { useState } from 'react'
import { ALL_ITEMS, CHANNELS, LAYERS, OPPS, PHASES, PROBLEMS, SERVICES, TOOLS } from './blueprintData'

/* Five chapter visuals. HTML carries every word (stays readable at any
   width); SVG only draws connectors in a 0–100 space with non-scaling
   strokes. Each visual animates in through CSS when its parent is `.is-on`. */
const ln = (d: string, i: number, cls = '') => <path key={i} d={d} className={`bv-ln ${cls}`} vectorEffect="non-scaling-stroke" pathLength={1} style={{ ['--i' as string]: i }} />

const Check = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path d="m3.5 8.4 2.9 2.9 6-6.4" />
  </svg>
)

/* 01 · Business intelligence: profile → tools → bottlenecks, scanned */
export function V1() {
  return (
    <div className="bv bv1">
      <svg className="bv-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {[22, 41, 60, 79].map((y, i) => ln(`M30,50 C36,50 36,${y} 41,${y}`, i))}
        {[28, 50, 72].map((y, i) => ln(`M64,${[22, 50, 79][i]} C68,${[22, 50, 79][i]} 67,${y} 71,${y}`, i + 4, 'bv-ln--warn'))}
      </svg>
      <div className="bv1__profile bv-card" style={{ ['--i' as string]: 0 }}>
        <span className="bv-k">Company profile</span>
        <b>Sample Co.</b>
        <dl>
          <div>
            <dt>Industry</dt>
            <dd>Services</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>11–50</dd>
          </div>
          <div>
            <dt>Channels</dt>
            <dd>Web · Social</dd>
          </div>
        </dl>
      </div>
      <div className="bv1__tools">
        <span className="bv-k">Current stack</span>
        {TOOLS.map((t, i) => (
          <span key={t} className="bv-node" style={{ ['--i' as string]: i + 1 }}>
            <i /> {t}
          </span>
        ))}
      </div>
      <div className="bv1__probs">
        <span className="bv-k bv-k--warn">Problems found</span>
        {PROBLEMS.map((t, i) => (
          <span key={t} className="bv-flag" style={{ ['--i' as string]: i + 5 }}>
            <i /> {t}
          </span>
        ))}
      </div>
      <span className="bv-scan" aria-hidden="true" />
    </div>
  )
}

/* 02 · Opportunity map: one blueprint core, six business functions */
export function V2({ on }: { on: boolean }) {
  const [sel, setSel] = useState('sales')
  const s = OPPS.find((o) => o.id === sel)!
  return (
    <div className="bv bv2">
      <div className="bv2__map">
        <svg className="bv-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {OPPS.map((o, i) => ln(`M50,50 L${o.x},${o.y}`, i, o.id === sel ? 'bv-ln--hot' : ''))}
        </svg>
        <span className="bv2__core">
          <b>AI</b>
          <small>Blueprint</small>
        </span>
        {OPPS.map((o, i) => (
          <button
            key={o.id}
            type="button"
            className={`bv2__node ${o.id === sel ? 'is-sel' : ''}`}
            style={{ left: `${o.x}%`, top: `${o.y}%`, ['--i' as string]: i }}
            onClick={() => setSel(o.id)}
            aria-pressed={o.id === sel}
            tabIndex={on ? 0 : -1}
          >
            <b>{o.t}</b>
            <small>{o.o}</small>
          </button>
        ))}
      </div>
      <div className="bv2__rec" key={sel} aria-live="polite">
        <span className="bv-k">Recommended · {s.t}</span>
        <b>{s.o}</b>
        <p>{s.d}</p>
      </div>
    </div>
  )
}

/* 03 · Architecture: four layers assemble into one system */
export function V3() {
  return (
    <div className="bv bv3">
      <div className="bv3__stack">
        {LAYERS.map((l, i) => (
          <div key={l.k} className="bv3__layer bv-card" style={{ ['--i' as string]: i }}>
            <span className="bv-k">{l.k}</span>
            <span className="bv3__chips">
              {l.chips.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="bv3__app bv-card" style={{ ['--i' as string]: 4 }} aria-hidden="true">
        <span className="bv3__bar">
          <i />
          <i />
          <i />
        </span>
        <span className="bv3__h" />
        <span className="bv3__l" />
        <span className="bv3__l bv3__l--s" />
        <span className="bv3__ask">
          <i /> Ask the assistant…
        </span>
        <span className="bv3__tiles">
          <i />
          <i />
        </span>
      </div>
    </div>
  )
}

/* 04 · Growth & impact: illustrative curves, channels, before/after */
export function V4() {
  return (
    <div className="bv bv4">
      <div className="bv4__chart bv-card" style={{ ['--i' as string]: 0 }}>
        <span className="bv-k">
          Digital growth <em>illustrative</em>
        </span>
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
          {[12.5, 25, 37.5].map((y) => (
            <path key={y} d={`M0,${y} H100`} className="bv4__grid" vectorEffect="non-scaling-stroke" />
          ))}
          <path d="M0,40 C15,39 25,36 40,34 S70,31 100,28" className="bv4__base" vectorEffect="non-scaling-stroke" pathLength={1} />
          <path d="M0,40 C15,38 25,32 40,27 S70,15 100,8 L100,50 L0,50 Z" className="bv4__area" />
          <path d="M0,40 C15,38 25,32 40,27 S70,15 100,8" className="bv4__up" vectorEffect="non-scaling-stroke" pathLength={1} />
        </svg>
        <span className="bv4__legend">
          <span>
            <i className="is-up" /> With recommendations
          </span>
          <span>
            <i /> Current path
          </span>
        </span>
      </div>
      <div className="bv4__side">
        <div className="bv-card" style={{ ['--i' as string]: 1 }}>
          <span className="bv-k">Channel potential</span>
          {CHANNELS.map((c, i) => (
            <span key={c.k} className="bv4__ch" style={{ ['--i' as string]: i + 2, ['--v' as string]: c.v }}>
              <span>{c.k}</span>
              <i />
            </span>
          ))}
        </div>
        <div className="bv-card" style={{ ['--i' as string]: 6 }}>
          <span className="bv-k">Manual work · before / after</span>
          <span className="bv4__cmp" style={{ ['--v' as string]: 0.9 }}>
            <i />
          </span>
          <span className="bv4__cmp bv4__cmp--after" style={{ ['--v' as string]: 0.42 }}>
            <i />
          </span>
          <small className="bv4__note">Sample estimate · not a forecast</small>
        </div>
      </div>
    </div>
  )
}

/* 05 · Execution: roadmap draws, milestones light, the report assembles */
export function V5() {
  return (
    <div className="bv bv5">
      <div className="bv5__road">
        <span className="bv-k">Implementation roadmap</span>
        <ol>
          {PHASES.map((p, i) => (
            <li key={p.k} style={{ ['--i' as string]: i }}>
              <i />
              <span>
                <small>{p.k}</small>
                <b>{p.t}</b>
                <em>{p.d}</em>
              </span>
            </li>
          ))}
        </ol>
        <span className="bv-k">Recommended services</span>
        <span className="bv5__svcs">
          {SERVICES.map((s, i) => (
            <span key={s} style={{ ['--i' as string]: i + 3 }}>
              {s}
            </span>
          ))}
        </span>
      </div>
      <div className="bv5__doc" aria-label="Blueprint report preview">
        <span className="bv5__page bv5__page--3" aria-hidden="true" />
        <span className="bv5__page bv5__page--2" aria-hidden="true" />
        <div className="bv5__page bv5__page--1">
          <span className="bv5__logo" aria-hidden="true" />
          <b>AI Blueprint</b>
          <small>Sample Co. · PDF</small>
          <ul>
            {ALL_ITEMS.map((t, i) => (
              <li key={t} style={{ ['--i' as string]: i }}>
                <Check />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
