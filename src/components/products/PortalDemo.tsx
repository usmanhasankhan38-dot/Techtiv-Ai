import { useEffect, useState } from 'react'
import { ACTIVITY, CHANNELS, INSIGHTS, KPIS, PROJECTS, SERIES, VIEWS, type View } from './productsData'
import { Ic } from './Ic'

/* 02 · The intelligent command centre — a client portal with three working
   views. Sample data only; numbers are illustrative, never results. */
const VIEW_IC: Record<View, string> = { overview: 'grid', analytics: 'chart', insights: 'bulb' }

function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}

function Chart({ range }: { range: '7d' | '30d' }) {
  const s = SERIES[range]
  const max = Math.max(...s.v) * 1.15
  const W = 300
  const H = 112
  const pts = s.v.map((v, i) => [Math.round(8 + (i * (W - 16)) / (s.v.length - 1)), Math.round(H - 6 - (v / max) * (H - 18))] as [number, number])
  const line = smooth(pts)
  const last = pts[pts.length - 1]
  return (
    <svg className="pp-chart" viewBox={`0 0 ${W} ${H + 16}`} key={range} aria-hidden="true">
      <defs>
        <linearGradient id="pp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3de8ff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#3de8ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pp-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3de8ff" />
          <stop offset="1" stopColor="#c6ff00" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <path key={f} d={`M0,${H * f} H${W}`} className="pp-chart__grid" />
      ))}
      <path d={`${line} L${last[0]},${H} L${pts[0][0]},${H} Z`} fill="url(#pp-area)" className="pp-chart__area" />
      <path d={line} pathLength={1} className="pp-chart__line" />
      <circle cx={last[0]} cy={last[1]} r="3.4" className="pp-chart__pt" />
      <circle cx={last[0]} cy={last[1]} r="8" className="pp-chart__halo" />
      {s.labels.map((l, i) => (
        <text key={i} x={pts[i][0]} y={H + 13} textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  )
}

export default function PortalDemo({ resetKey }: { resetKey: number }) {
  const [view, setView] = useState<View>('overview')
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const [applied, setApplied] = useState<string[]>([])
  useEffect(() => {
    setView('overview')
    setRange('7d')
    setApplied([])
  }, [resetKey])

  const onTabKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const i = (VIEWS.findIndex((v) => v.id === view) + d + VIEWS.length) % VIEWS.length
    setView(VIEWS[i].id)
    const g = e.currentTarget as HTMLElement
    requestAnimationFrame(() => g.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
  }

  return (
    <div className={`pp pp--${view}`}>
      <aside className="pp-side">
        <span className="pp-side__logo" aria-hidden="true">
          <i />
        </span>
        <div className="pp-side__tabs" role="tablist" aria-label="Portal views" aria-orientation="vertical" onKeyDown={onTabKey}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              id={`pp-tab-${v.id}`}
              aria-selected={view === v.id}
              aria-controls="pp-view"
              tabIndex={view === v.id ? 0 : -1}
              className={`pp-tab ${view === v.id ? 'is-on' : ''}`}
              onClick={() => setView(v.id)}
            >
              <Ic n={VIEW_IC[v.id]} s={17} />
              <span>{v.t}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="pp-main">
        <header className="pp-top">
          <div>
            <p className="pp-top__k">Client portal · sample workspace</p>
            <p className="pp-top__t">{VIEWS.find((v) => v.id === view)!.t}</p>
          </div>
          <span className="pp-top__av" aria-hidden="true">
            SC
          </span>
        </header>

        <div id="pp-view" role="tabpanel" aria-labelledby={`pp-tab-${view}`} className="pp-view" key={view}>
          {view === 'overview' && (
            <>
              <div className="pp-kpis">
                {KPIS.map((k, i) => (
                  <div key={k.k} className="pp-kpi" style={{ ['--i' as string]: i }}>
                    <span>{k.k}</span>
                    <b>{k.v}</b>
                    <small>{k.d}</small>
                  </div>
                ))}
              </div>
              <div className="pp-block">
                <p className="pp-block__k">Projects</p>
                {PROJECTS.map((p, i) => (
                  <div key={p.t} className="pp-proj" style={{ ['--i' as string]: i }}>
                    <span>
                      <b>{p.t}</b>
                      <small>{p.c}</small>
                    </span>
                    <span className="pp-prog">
                      <i style={{ ['--p' as string]: p.p }} />
                    </span>
                    <em>{Math.round(p.p * 100)}%</em>
                  </div>
                ))}
              </div>
              <div className="pp-block">
                <p className="pp-block__k">Activity</p>
                <ul className="pp-feed">
                  {ACTIVITY.map((a, i) => (
                    <li key={a.t} style={{ ['--i' as string]: i }}>
                      <i aria-hidden="true" />
                      {a.t}
                      <small>{a.w}</small>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {view === 'analytics' && (
            <>
              <div className="pp-block pp-block--chart">
                <div className="pp-block__row">
                  <p className="pp-block__k">
                    Portal sessions <em>sample</em>
                  </p>
                  <div className="pp-seg" role="group" aria-label="Date range">
                    {(['7d', '30d'] as const).map((r) => (
                      <button key={r} type="button" aria-pressed={range === r} className={range === r ? 'is-on' : ''} onClick={() => setRange(r)}>
                        {r === '7d' ? '7 days' : '30 days'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="pp-big" key={range}>
                  {SERIES[range].total}
                  <small>sessions</small>
                </p>
                <Chart range={range} />
              </div>
              <div className="pp-block">
                <p className="pp-block__k">Where visits come from</p>
                {CHANNELS.map((c, i) => (
                  <div key={c.k} className="pp-chan" style={{ ['--i' as string]: i }}>
                    <span>{c.k}</span>
                    <span className="pp-prog pp-prog--chan">
                      <i style={{ ['--p' as string]: c.v }} />
                    </span>
                    <em>{Math.round(c.v * 100)}%</em>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'insights' && (
            <>
              <div className="pp-ai">
                <Ic n="spark" s={15} />
                <p>
                  3 suggestions from this week’s sample activity. <em>Nothing changes until you choose.</em>
                </p>
              </div>
              {INSIGHTS.map((x, i) => {
                const on = applied.includes(x.id)
                return (
                  <div key={x.id} className={`pp-ins ${on ? 'is-applied' : ''}`} style={{ ['--i' as string]: i }}>
                    <span className={`pp-ins__tag pp-ins__tag--${x.tag.toLowerCase()}`}>{x.tag}</span>
                    <b>{x.t}</b>
                    <p>{x.d}</p>
                    <button type="button" aria-pressed={on} onClick={() => setApplied((a) => (on ? a.filter((y) => y !== x.id) : [...a, x.id]))}>
                      {on ? (
                        <>
                          <Ic n="check" s={13} /> Added to plan
                        </>
                      ) : (
                        x.act
                      )}
                    </button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
