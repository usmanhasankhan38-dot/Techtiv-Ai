import type { AgentId } from '../agenticData'
import { CONTENT_MODES, FINANCE, LEGAL, OPS_NODES, RESEARCH, RESEARCH_NODES, SUPPORT } from './bentoData'

/* ==========================================================================
   Seven living interfaces — one family
   · every visual is a pure function of `step` (0…N) and `variant`; CSS
     transitions carry the motion, so replays and switches are smooth
   · light from the top (stage beam), lime = what is happening now,
     cyan = structure / done, hairlines 1px, data strokes 1.5px
   · real text stays crisp vector text; minimum 10 user units
   · `--px/--py` (−1…1) from the card pointer give a light parallax
   ========================================================================== */
export type VP = { step: number; N: number; variant: string; selected: boolean; compact: boolean; node: number; onNode: (i: number) => void }
const atF = (step: number) => (k: number) => (step >= k ? 'is-on' : '')

/* ---------------------------------------------------------------- 01 SDR */
function SDR({ step, selected }: VP) {
  const at = atF(step)
  const crumb = step >= 6 ? 3 : step >= 5 ? 2 : step >= 2 ? 1 : step >= 1 ? 0 : -1
  const quals: [string, string, number][] = [
    ['Fit', 'Ideal customer', 3],
    ['Intent', 'Asked for pricing', 4],
    ['Timing', 'This quarter', 5],
  ]
  return (
    <svg viewBox="0 0 420 300" className="bx bx--sdr" aria-hidden="true">
      <defs>
        <linearGradient id="sdr-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3de8ff" />
          <stop offset="0.5" stopColor="#c6ff00" />
          <stop offset="1" stopColor="#3de8ff" />
        </linearGradient>
        <radialGradient id="sdr-floor">
          <stop offset="0" stopColor="#c6ff00" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c6ff00" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* pipeline breadcrumb */}
      <g className="sdr-crumb" transform="translate(24 46)">
        {['Prospect', 'Qualify', 'Follow-up', 'Book'].map((t, i) => (
          <g key={t} transform={`translate(${i * 66} 0)`} className={i <= crumb ? (i === crumb ? 'is-now' : 'is-done') : ''}>
            <circle r="3" cy="-3.5" />
            <text x="8" className="bx-t bx-t--s">
              {t}
            </text>
          </g>
        ))}
      </g>
      <g className="sdr-par">
        <ellipse cx="210" cy="214" rx="160" ry="44" fill="url(#sdr-floor)" className={`sdr-floor ${at(3)}`} />
        {/* ring, back half (behind the lead) */}
        <path d="M80,206 A130,34 0 0 1 340,206" className={`sdr-ring sdr-ring--back ${at(3)}`} />
        <path d="M118,206 A92,22 0 0 1 302,206" className="sdr-ring sdr-ring--inner" />
        {/* incoming signal path */}
        <path id="sdr-in" d="M18,108 C90,96 150,128 210,172" className={`sdr-in ${at(1)}`} />
        <circle r="5" className={`sdr-sig ${step >= 1 && step < 3 ? 'is-on' : ''} ${step >= 2 ? 'is-arrived' : ''}`} />
        {/* lead profile */}
        <g className={`sdr-lead ${at(2)} ${step >= 6 ? 'is-booked' : ''}`}>
          <rect x="146" y="114" width="150" height="54" rx="14" className="bx-glass" />
          <circle cx="170" cy="141" r="12" className="sdr-av" />
          <text x="170" y="145" textAnchor="middle" className="bx-t bx-t--b sdr-av-t">
            SL
          </text>
          <text x="190" y="137" className="bx-t bx-t--b">
            Sample lead
          </text>
          <text x="190" y="152" className="bx-t bx-t--s">
            Ops manager · Acme
          </text>
        </g>
        {/* ring, front half */}
        <path d="M80,206 A130,34 0 0 0 340,206" className={`sdr-ring sdr-ring--glow ${at(3)}`} />
        <path d="M80,206 A130,34 0 0 0 340,206" stroke="url(#sdr-ring)" className={`sdr-ring sdr-ring--front ${at(3)}`} />
        <ellipse cx="210" cy="206" rx="130" ry="34" pathLength={100} className={`sdr-sweep ${at(3)}`} />
      </g>
      {/* qualification indicators */}
      {quals.map(([k, v, s], i) => {
        const x = [96, 210, 324][i]
        const y = [256, 262, 256][i]
        return (
          <g key={k} className={`sdr-q ${at(s)}`} transform={`translate(${x} ${y})`}>
            <path d={`M0,-14 L${(210 - x) * 0.18},-26`} className="sdr-q__tie" />
            <rect x="-34" y="-12" width="68" height="24" rx="12" className="sdr-q__pill" />
            <circle cx="-20" r="4" className="sdr-q__dot" />
            <text x="-10" y="4" className="bx-t">
              {k}
            </text>
            <text y="26" textAnchor="middle" className={`bx-t bx-t--xs sdr-q__v ${selected ? 'is-shown' : ''}`}>
              {v}
            </text>
          </g>
        )
      })}
      {/* booking */}
      <path d="M296,132 C318,126 324,100 336,90" className={`sdr-book-path ${at(6)}`} pathLength={1} />
      <g className={`sdr-cal ${at(6)}`} transform="translate(300 18)">
        <rect width="104" height="70" rx="12" className="bx-glass" />
        <text x="12" y="19" className="bx-t bx-t--s">
          Tue · sample
        </text>
        {['09:30', '10:00', '11:30'].map((t, i) => (
          <g key={t} transform={`translate(10 ${26 + i * 13})`} className={i === 1 ? 'sdr-slot is-pick' : 'sdr-slot'}>
            <rect width="84" height="11" rx="4" />
            <text x="6" y="8.5" className="bx-t bx-t--xs">
              {t}
            </text>
          </g>
        ))}
        <g className="sdr-ok" transform="translate(84 13)">
          <circle r="7" />
          <path d="m-3 0.3 2.2 2.2 4-4.4" />
        </g>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- 02 ContentBot */
function Writer({ step, variant }: VP) {
  const at = atF(step)
  const mode = CONTENT_MODES[variant] ?? CONTENT_MODES.blog
  let y = 48
  const blocks = mode.blocks.map((b, i) => {
    const h = { h: 12, l: 6, s: 6, img: 50, sq: 104, tags: 16, btn: 22, subj: 14 }[b]
    const el = { b, y, h, i }
    y += h + (b === 'l' || b === 's' ? 8 : 12)
    return el
  })
  const stages: [string, number][] = [
    ['Brief', 1],
    ['Draft', 2],
    ['Review', 4],
    ['Ready', 5],
  ]
  return (
    <svg viewBox="0 0 420 300" className={`bx bx--writer ${step >= 3 ? 'is-refined' : ''}`} aria-hidden="true">
      <defs>
        <linearGradient id="wr-img" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3de8ff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c6ff00" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <g className="wr-doc" transform="translate(30 30)">
        <rect width="262" height="246" rx="16" className="bx-glass bx-glass--hi" />
        <path d="M0,30 H262" className="bx-hair" />
        {[14, 26, 38].map((x) => (
          <circle key={x} cx={x} cy="15" r="3.2" className="wr-dot" />
        ))}
        <text x="52" y="19" className="bx-t bx-t--s">
          {mode.title} · draft
        </text>
        <g className={`wr-ready ${at(5)}`} transform="translate(204 15)">
          <rect x="-4" y="-9" width="52" height="18" rx="9" />
          <text x="22" y="4" textAnchor="middle" className="bx-t bx-t--xs">
            Ready
          </text>
        </g>
        {blocks.map(({ b, y: by, h, i }) => {
          const cls = `wr-b wr-b--${b} ${at(2)}`
          const st = { transitionDelay: `${i * 90}ms` }
          if (b === 'h') return <rect key={i} x="18" y={by} width="150" height={h} rx="4" className={cls} style={st} />
          if (b === 'l') return <rect key={i} x="18" y={by} width="224" height={h} rx="3" className={cls} style={st} />
          if (b === 's') return <rect key={i} x="18" y={by} width="140" height={h} rx="3" className={cls} style={st} />
          if (b === 'img') return <rect key={i} x="18" y={by} width="226" height={h} rx="9" fill="url(#wr-img)" className={cls} style={st} />
          if (b === 'sq') return <rect key={i} x="18" y={by} width="226" height={h} rx="10" fill="url(#wr-img)" className={cls} style={st} />
          if (b === 'btn') return <rect key={i} x="18" y={by} width="92" height={h} rx="11" className={cls} style={st} />
          if (b === 'subj')
            return (
              <g key={i} className={cls} style={st}>
                <text x="18" y={by + 10} className="bx-t bx-t--s">
                  Subject
                </text>
                <rect x="66" y={by + 3} width="150" height="7" rx="3" className="wr-b--l" />
              </g>
            )
          return (
            <g key={i} className={cls} style={st}>
              {['#launch', '#local', '#tips'].map((t, k) => (
                <g key={t} transform={`translate(${18 + k * 62} ${by})`}>
                  <rect width="54" height="16" rx="8" className="wr-tag" />
                  <text x="27" y="11.5" textAnchor="middle" className="bx-t bx-t--xs">
                    {t}
                  </text>
                </g>
              ))}
            </g>
          )
        })}
        <rect x="18" y={Math.min(y, 230)} width="2" height="10" className="wr-caret" />
        <rect x="0" y="34" width="262" height="3" className={`wr-scan ${step === 3 ? 'is-on' : ''}`} />
      </g>
      {/* brief chip */}
      <g className={`wr-brief ${at(1)} ${step >= 2 ? 'is-used' : ''}`} transform="translate(300 14)">
        <rect width="114" height="26" rx="13" className="bx-glass" />
        <text x="57" y="17" textAnchor="middle" className="bx-t bx-t--s">
          Brief · spring launch
        </text>
      </g>
      {/* editorial pipeline */}
      <g transform="translate(318 66)">
        <path d="M6,0 V126" className="bx-hair" />
        {stages.map(([t, s], i) => (
          <g key={t} transform={`translate(0 ${i * 42})`} className={`wr-stage ${at(s)}`}>
            <circle cx="6" r="6" />
            <text x="20" y="4" className="bx-t">
              {t}
            </text>
          </g>
        ))}
      </g>
      {/* tone control */}
      <g transform="translate(318 222)" className={`wr-tone ${at(4)}`}>
        <text y="0" className="bx-t bx-t--s">
          Tone
        </text>
        <rect y="10" width="84" height="4" rx="2" className="wr-tone__track" />
        <circle cy="12" r="6" className="wr-tone__knob" />
        <text y="32" className="bx-t bx-t--xs">
          {mode.tone[0]}
        </text>
        <text x="84" y="32" textAnchor="end" className="bx-t bx-t--xs wr-tone__to">
          {mode.tone[1]}
        </text>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- 03 ResearchBot */
function Intel({ step, variant }: VP) {
  const at = atF(step)
  const cat = RESEARCH[variant] ?? RESEARCH.market
  const C = { x: 210, y: 122 }
  const nodes = RESEARCH_NODES.map((n, i) => {
    const a = -Math.PI / 2 + (i / RESEARCH_NODES.length) * Math.PI * 2 + 0.2
    return { ...n, i, x: C.x + Math.cos(a) * 160, y: C.y + Math.sin(a) * 86 }
  })
  return (
    <svg viewBox="0 0 420 300" className="bx bx--intel" aria-hidden="true">
      <defs>
        <radialGradient id="in-scan-g" cx="210" cy="122" r="170" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3de8ff" stopOpacity="0.22" />
          <stop offset="0.7" stopColor="#3de8ff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#3de8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="in-core">
          <stop offset="0" stopColor="#f4ffd0" />
          <stop offset="0.4" stopColor="#c6ff00" stopOpacity="0.8" />
          <stop offset="1" stopColor="#c6ff00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={C.x} cy={C.y} rx="160" ry="86" className="bx-hair in-orbit" />
      <ellipse cx={C.x} cy={C.y} rx="96" ry="52" className="bx-hair in-orbit" />
      {/* scanning beam (idle sweep; brighter while scanning) */}
      <g className={`in-scan ${step === 2 ? 'is-hot' : ''}`} style={{ transformOrigin: `${C.x}px ${C.y}px` }}>
        <path d={`M${C.x},${C.y} L${C.x + 168},${C.y - 30} A168,90 0 0 1 ${C.x + 168},${C.y + 30} Z`} className="in-scan__fill" />
      </g>
      {nodes.map((n) => {
        const rel = cat.nodes.includes(n.i)
        const mx = (n.x + C.x) / 2 + (n.y - C.y) * 0.25
        const my = (n.y + C.y) / 2 - (n.x - C.x) * 0.12
        return (
          <g key={n.i} className={`in-node ${at(1)} ${rel && step >= 3 ? 'is-rel' : ''} ${!rel && step >= 3 ? 'is-quiet' : ''}`} style={{ transitionDelay: `${n.i * 50}ms` }}>
            <path d={`M${n.x},${n.y} Q${mx},${my} ${C.x},${C.y}`} pathLength={1} className={`in-link ${rel && step >= 4 ? 'is-on' : ''}`} />
            <circle cx={n.x} cy={n.y} r="5.5" className="in-dot" />
            <text x={n.x} y={n.y + (n.y > C.y ? 18 : -10)} textAnchor="middle" className="bx-t bx-t--xs">
              {n.t}
            </text>
          </g>
        )
      })}
      <circle cx={C.x} cy={C.y} r="30" fill="url(#in-core)" className={`in-core ${at(4)}`} />
      <circle cx={C.x} cy={C.y} r="13" className="in-core__ring" />
      <circle cx={C.x} cy={C.y} r="4" className="in-core__dot" />
      <g className={`in-card ${at(5)}`} transform="translate(46 232)">
        <rect width="328" height="54" rx="14" className="bx-glass bx-glass--lime" />
        <text x="16" y="21" className="bx-t bx-t--lime">
          Insight · 3 sources
        </text>
        <text x="16" y="39" className="bx-t">
          {cat.insight}
        </text>
        <text x="312" y="21" textAnchor="end" className="bx-t bx-t--xs">
          sample
        </text>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- 04 SupportGenie (wide) */
function Support({ step, variant, compact }: VP) {
  const at = atF(step)
  const s = SUPPORT[variant] ?? SUPPORT.general
  const esc = variant === 'escalation'
  return (
    <svg viewBox={compact ? '0 0 440 540' : '0 0 880 300'} className="bx bx--support" aria-hidden="true">
      {/* panel A: understand the inquiry */}
      <g className={`sp-msg ${at(1)}`} transform="translate(26 34)">
        <circle cx="16" cy="18" r="14" className="sp-av" />
        <text x="16" y="22" textAnchor="middle" className="bx-t bx-t--b">
          C
        </text>
        <foreignObject x="38" y="0" width="250" height="60">
          <div className="sp-bubble">{s.msg}</div>
        </foreignObject>
      </g>
      <path d="M90,100 C90,124 90,128 104,140" className={`sp-flow ${at(2)}`} pathLength={1} />
      <g className={`sp-intent ${at(2)}`} transform="translate(62 140)">
        <rect width="196" height="30" rx="15" className={`bx-glass ${esc ? 'bx-glass--lime' : ''}`} />
        <circle cx="16" cy="15" r="5" className="sp-intent__dot" />
        <text x="30" y="19.5" className="bx-t">
          Intent · <tspan className={esc ? 'bx-t--lime' : 'bx-t--cyan'}>{s.intent}</tspan>
        </text>
      </g>
      <path d="M160,170 C160,196 190,200 210,206" className={`sp-flow ${at(3)}`} pathLength={1} />
      <g className={`sp-kb ${at(3)}`} transform="translate(196 196)">
        <rect width="224" height="62" rx="14" className="bx-glass" />
        <path d="M18,16 h14 l6,6 v18 h-20 z" className="sp-kb__doc" />
        <text x="50" y="27" className="bx-t bx-t--b">
          {s.kb}
        </text>
        <text x="50" y="44" className="bx-t bx-t--xs">
          Knowledge base · sample
        </text>
      </g>
      {/* hand-off between panels */}
      {compact ? <path d="M196,227 C70,227 40,300 40,410" className={`sp-flow ${at(4)}`} pathLength={1} /> : <path d="M420,227 C452,227 446,160 474,160" className={`sp-flow ${at(4)}`} pathLength={1} />}

      {/* panel B: answer or escalate */}
      <g transform={compact ? 'translate(-434 250)' : undefined}>
        <circle cx="474" cy="160" r="6" className={`sp-fork ${at(4)}`} />
        <path d="M474,160 C510,160 510,86 548,86" className={`sp-branch ${!esc && step >= 4 ? 'is-on' : ''} ${esc ? 'is-quiet' : ''}`} pathLength={1} />
        <path d="M474,160 C510,160 510,226 548,226" className={`sp-branch ${esc && step >= 4 ? 'is-on' : ''} ${!esc ? 'is-quiet' : ''}`} pathLength={1} />
        <g className={`sp-lane ${!esc ? 'is-active' : 'is-quiet'} ${!esc ? at(4) : ''}`} transform="translate(548 40)">
          <rect width="300" height="92" rx="16" className="bx-glass bx-glass--hi" />
          <text x="16" y="22" className="bx-t bx-t--cyan">
            Suggested reply
          </text>
          <foreignObject x="16" y="30" width="270" height="40">
            <div className="sp-reply">{SUPPORT.general.out}</div>
          </foreignObject>
          <text x="16" y="80" className={`bx-t bx-t--xs sp-approve ${!esc && step >= 5 ? 'is-on' : ''}`}>
            {!esc && step >= 5 ? 'Approved by your agent' : 'Waiting for agent approval'}
          </text>
        </g>
        <g className={`sp-lane ${esc ? 'is-active' : 'is-quiet'} ${esc ? at(4) : ''}`} transform="translate(548 180)">
          <rect width="300" height="92" rx="16" className="bx-glass bx-glass--hi" />
          <circle cx="24" cy="22" r="9" className="sp-person" />
          <path d="M20.5 21.5a3.5 3.5 0 1 1 7 0M17.5 28c1.5-2.4 3.7-3.4 6.5-3.4s5 1 6.5 3.4" className="sp-person__g" transform="translate(0 -3)" />
          <text x="42" y="26" className="bx-t bx-t--lime">
            Escalate to a person
          </text>
          <foreignObject x="16" y="38" width="270" height="40">
            <div className="sp-reply">{SUPPORT.escalation.out}</div>
          </foreignObject>
        </g>
        <g className={`sp-done ${at(6)}`} transform={esc ? 'translate(790 194)' : 'translate(790 54)'}>
          <rect x="-34" y="-12" width="76" height="24" rx="12" />
          <path d="m-22 0.4 3 3 5.6-6" />
          <text x="-8" y="4.5" className="bx-t bx-t--xs">
            {s.end}
          </text>
        </g>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- 05 FinanceAI */
function CFO({ step, variant }: VP) {
  const at = atF(step)
  const f = FINANCE[variant] ?? FINANCE.revenue
  const X = (i: number) => 44 + i * 24.4
  const Y = (v: number) => 226 - v * 1.55
  const pts = f.data.map((v, i) => [X(i), Y(v)] as const)
  const smooth = (p: readonly (readonly [number, number])[]) => {
    let d = `M${p[0][0]},${p[0][1]}`
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] ?? p[i]
      const p1 = p[i]
      const p2 = p[i + 1]
      const p3 = p[i + 2] ?? p2
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    }
    return d
  }
  const line = smooth(pts)
  const last = pts[pts.length - 1]
  const fcPts = [last, ...f.fc.map((v, i) => [X(12 + i), Y(v)] as const)]
  const fcLine = smooth(fcPts)
  const band = `M${last[0]},${last[1]} ${f.fc.map((v, i) => `L${X(12 + i)},${Y(v + 4 + i * 3)}`).join(' ')} ${f.fc
    .map((_, i) => `L${X(14 - i)},${Y(f.fc[2 - i] - 4 - (2 - i) * 3)}`)
    .join(' ')} Z`
  const peak = f.data.indexOf(Math.max(...f.data))
  return (
    <svg viewBox="0 0 420 300" className="bx bx--cfo" aria-hidden="true" key={variant}>
      <defs>
        <linearGradient id="cf-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6ff00" stopOpacity="0.24" />
          <stop offset="1" stopColor="#c6ff00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="44" y="40" className="bx-t bx-t--d">
        {f.label}
      </text>
      <text x="44" y="58" className="bx-t bx-t--s">
        {f.delta}
      </text>
      <g transform="translate(330 30)">
        <rect width="66" height="20" rx="10" className="cf-pill" />
        <text x="33" y="14" textAnchor="middle" className="bx-t bx-t--xs">
          sample data
        </text>
      </g>
      <g className={`cf-grid ${at(1)}`}>
        {[0, 25, 50, 75].map((v) => (
          <g key={v}>
            <path d={`M44,${Y(v)} H396`} className={v ? 'bx-hair bx-hair--dash' : 'bx-hair'} />
            <text x="36" y={Y(v) + 3.5} textAnchor="end" className="bx-t bx-t--xs">
              {v}
            </text>
          </g>
        ))}
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
          <text key={q} x={X(i * 3 + 1)} y="242" textAnchor="middle" className="bx-t bx-t--xs">
            {q}
          </text>
        ))}
        <text x={X(13)} y="242" textAnchor="middle" className="bx-t bx-t--xs cf-next">
          Next
        </text>
      </g>
      <path d={`${line} L${last[0]},226 L44,226 Z`} fill="url(#cf-area)" className={`cf-area ${at(2)}`} />
      <path d={line} pathLength={1} className={`cf-line ${at(2)}`} />
      <path d={band} className={`cf-band ${at(4)}`} />
      <path d={fcLine} pathLength={1} className={`cf-fc ${at(4)}`} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === peak ? 3.6 : 2.4} className={`cf-pt ${at(3)} ${i === peak ? 'is-peak' : ''}`} style={{ transitionDelay: `${i * 40}ms` }} />
      ))}
      <path d={`M${pts[peak][0]},${pts[peak][1] + 6} V226`} className={`cf-guide ${at(5)}`} />
      <g className={`cf-insight ${at(5)}`} transform="translate(44 256)">
        <rect width="352" height="34" rx="12" className="bx-glass bx-glass--lime" />
        <circle cx="16" cy="17" r="4" className="cf-insight__dot" />
        <text x="28" y="21.5" className="bx-t">
          {f.insight}
        </text>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- 06 LegalMind */
function Legal({ step, variant }: VP) {
  const at = atF(step)
  const l = LEGAL[variant] ?? LEGAL.contract
  const lines = Array.from({ length: 11 }, (_, i) => ({ i, y: 64 + i * 18 + (i > 3 ? 8 : 0) + (i > 7 ? 8 : 0), w: [150, 164, 132, 158, 166, 148, 120, 160, 152, 138, 108][i] }))
  return (
    <svg viewBox="0 0 420 300" className="bx bx--legal" aria-hidden="true">
      <g className="lg-doc" transform="translate(24 22)">
        <rect width="214" height="264" rx="14" className="bx-glass bx-glass--hi" />
        <text x="18" y="26" className="bx-t bx-t--b">
          {l.doc}
        </text>
        <text x="18" y="41" className="bx-t bx-t--xs">
          Sample document
        </text>
        {lines.map(({ i, y, w }) => {
          const hl = l.hl.includes(i)
          return (
            <g key={i}>
              <rect x="14" y={y - 7} width={w + 12} height="14" rx="4" className={`lg-hl ${hl && step >= 3 ? 'is-on' : ''}`} style={{ transitionDelay: `${l.hl.indexOf(i) * 140}ms` }} />
              <rect x="20" y={y - 2} width={w} height="4" rx="2" className={`lg-ln ${hl && step >= 3 ? 'is-hl' : ''}`} />
              {hl && (
                <g className={`lg-mark ${at(4)}`} transform={`translate(196 ${y})`}>
                  <circle r="7" />
                  <text y="3.5" textAnchor="middle" className="bx-t bx-t--xs">
                    §
                  </text>
                </g>
              )}
            </g>
          )
        })}
        <rect x="6" width="202" height="2" className={`lg-scan ${step === 2 ? 'is-run' : ''}`} y="50" />
      </g>
      <g className={`lg-panel ${at(4)}`} transform="translate(254 22)">
        <rect width="150" height="264" rx="14" className="bx-glass" />
        <text x="14" y="26" className="bx-t bx-t--s">
          Policy match
        </text>
        {l.rules.map(([r, ok], i) => (
          <g key={r} transform={`translate(14 ${50 + i * 40})`} className={`lg-rule ${step >= 5 ? (ok ? 'is-ok' : 'is-flag') : ''}`} style={{ transitionDelay: `${i * 120}ms` }}>
            <rect width="16" height="16" rx="5" />
            <path d={ok ? 'm4 8.3 3 3 5-5.6' : 'M8 4.5v5M8 12.2v.1'} />
            <foreignObject x="22" y="-2" width="104" height="34">
              <div className="lg-rule__t">{r}</div>
            </foreignObject>
          </g>
        ))}
        <g className={`lg-risk ${at(5)} is-${l.risk.toLowerCase()}`} transform="translate(14 184)">
          <text className="bx-t bx-t--xs">Review status</text>
          <rect y="8" width="122" height="26" rx="13" />
          <text x="61" y="25" textAnchor="middle" className="bx-t">
            {l.risk} risk
          </text>
          <text y="52" className="bx-t bx-t--xs">
            {l.note}
          </text>
          <text y="66" className="bx-t bx-t--xs lg-disclaim">
            Sample · not legal advice
          </text>
        </g>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- 07 OpsBot (wide) */
type ON = { x: number; y: number; k: number; shape?: 'diamond' | 'human' }
const OPS_FULL: ON[] = [
  { x: 64, y: 160, k: 1 },
  { x: 196, y: 160, k: 2 },
  { x: 330, y: 160, k: 3, shape: 'diamond' },
  { x: 520, y: 92, k: 4 },
  { x: 666, y: 92, k: 5, shape: 'human' },
  { x: 812, y: 92, k: 6 },
]
const OPS_COMPACT: ON[] = [
  { x: 64, y: 140, k: 1 },
  { x: 220, y: 140, k: 2 },
  { x: 370, y: 140, k: 3, shape: 'diamond' },
  { x: 64, y: 420, k: 4 },
  { x: 220, y: 420, k: 5, shape: 'human' },
  { x: 370, y: 420, k: 6 },
]
function Ops({ step, selected, compact, node, onNode }: VP) {
  const P = compact ? OPS_COMPACT : OPS_FULL
  const edge = (a: ON, b: ON) => {
    if (Math.abs(a.y - b.y) < 2) return `M${a.x + 26},${a.y} H${b.x - 26}`
    if (compact) return `M${a.x},${a.y + 28} C${a.x},${a.y + 150} ${b.x},${b.y - 150} ${b.x},${b.y - 28}`
    return `M${a.x + 26},${a.y} C${a.x + 90},${a.y} ${b.x - 90},${b.y} ${b.x - 26},${b.y}`
  }
  const mon = compact ? null : { x: 520, y: 236 }
  const focus = node >= 0
  return (
    <svg viewBox={compact ? '0 0 440 560' : '0 0 880 300'} className={`bx bx--ops ${focus ? 'has-focus' : ''}`} aria-hidden={!selected}>
      <g transform="translate(24 30)" className="op-status">
        {[
          ['Supplier portal', 'ok'],
          ['Inventory', 'low'],
          ['ERP sync', 'ok'],
        ].map(([t, s], i) => (
          <g key={t} transform={`translate(${i * 128} 0)`}>
            <rect width="118" height="24" rx="12" className="bx-glass" />
            <circle cx="15" cy="12" r="4" className={`op-led is-${s}`} />
            <text x="26" y="16" className="bx-t bx-t--xs">
              {t} · {s}
            </text>
          </g>
        ))}
      </g>
      {P.slice(0, -1).map((a, i) => {
        const b = P[i + 1]
        const on = step >= b.k
        const dim = focus && node !== i && node !== i + 1
        return <path key={i} d={edge(a, b)} pathLength={1} className={`op-edge ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`} />
      })}
      {mon && (
        <g className={`op-no ${step >= 3 ? 'is-quiet' : ''}`}>
          <path d={`M${P[2].x},${P[2].y + 28} C${P[2].x},${mon.y} ${mon.x - 90},${mon.y} ${mon.x - 26},${mon.y}`} className="op-edge op-edge--no" />
          <rect x={mon.x - 26} y={mon.y - 16} width="120" height="32" rx="12" className="bx-glass" />
          <text x={mon.x - 12} y={mon.y + 4.5} className="bx-t bx-t--xs">
            No · log &amp; monitor
          </text>
        </g>
      )}
      {!compact && (
        <text x="420" y="110" className={`bx-t bx-t--xs op-yes ${step >= 3 ? 'is-on' : ''}`}>
          Yes · reorder
        </text>
      )}
      {P.map((p, i) => {
        const n = OPS_NODES[i]
        const st = step > p.k ? 'is-done' : step === p.k ? 'is-now' : ''
        const dim = focus && node !== i
        return (
          <g
            key={n.id}
            className={`op-node ${st} ${node === i ? 'is-picked' : ''} ${dim ? 'is-dim' : ''} ${selected ? 'is-pickable' : ''}`}
            transform={`translate(${p.x} ${p.y})`}
            role={selected ? 'button' : undefined}
            tabIndex={selected ? 0 : -1}
            aria-label={selected ? `${n.t}: ${n.d}` : undefined}
            aria-pressed={selected ? node === i : undefined}
            onClick={(e) => {
              if (!selected) return
              e.stopPropagation()
              onNode(node === i ? -1 : i)
            }}
            onKeyDown={(e) => {
              if (!selected || (e.key !== 'Enter' && e.key !== ' ')) return
              e.preventDefault()
              e.stopPropagation()
              onNode(node === i ? -1 : i)
            }}
          >
            <circle r="34" className="op-hit" />
            {p.shape === 'diamond' ? <rect x="-19" y="-19" width="38" height="38" rx="8" transform="rotate(45)" className="op-body" /> : <rect x="-26" y="-26" width="52" height="52" rx="16" className="op-body" />}
            {p.shape === 'human' ? (
              <path d="M-5.5 -4a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0M-10 12c2.3-4 5.6-6 10-6s7.7 2 10 6" className="op-glyph" />
            ) : p.shape === 'diamond' ? (
              <text y="4.5" textAnchor="middle" className="bx-t bx-t--b op-q">
                ?
              </text>
            ) : (
              <circle r="5" className="op-core" />
            )}
            <circle r="30" className="op-ripple" />
            <text y="48" textAnchor="middle" className="bx-t op-label">
              {n.t}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const VISUALS: Record<AgentId, (p: VP) => React.ReactElement> = {
  tivagent: SDR,
  contentbot: Writer,
  researchbot: Intel,
  supportgenie: Support,
  financeai: CFO,
  legalmind: Legal,
  opsbot: Ops,
}
