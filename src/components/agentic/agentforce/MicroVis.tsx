import type { ModuleId } from '../agenticData'

/* ==========================================================================
   Console micro-visualisations — driven only by the shared machine:
   `phase` (idle | preview | selected | processing | complete) and `step`
   (0–2 while processing). Rest state is calm and readable; activity is
   added on top, never required to understand the console.
   viewBox 260 × 64 for all four, 1px hairlines, 1.5px data strokes.
   ========================================================================== */
export type Phase = 'idle' | 'preview' | 'selected' | 'processing' | 'complete'
type P = { phase: Phase; step: number }

/* how far the task has progressed: 0 (nothing yet) … 3 (complete) */
const progress = ({ phase, step }: P) => (phase === 'complete' ? 3 : phase === 'processing' ? step : 0)

/* ---- Research: radar sweep discovering sources ---- */
const SRC: [number, number][] = [
  [86, 44],
  [108, 22],
  [150, 18],
  [176, 40],
  [62, 56],
  [196, 54],
  [130, 30],
]
function Research(p: P) {
  const g = progress(p)
  const lit = p.phase === 'idle' || p.phase === 'preview' ? 0 : [0, 3, 5, 7][g]
  return (
    <svg viewBox="0 0 260 64" className="mv mv--research" aria-hidden="true">
      {[20, 38, 56].map((r) => (
        <path key={r} d={`M${130 - r},64 A${r},${r} 0 0 1 ${130 + r},64`} className="mv__grid" />
      ))}
      <path d="M130,64 V6" className="mv__grid" />
      <g className="mv__sweep">
        <path d="M130,64 L130,8 A56,56 0 0 1 162,18 Z" className="mv__sweep-fill" />
        <path d="M130,64 L130,8" className="mv__sweep-line" />
      </g>
      {SRC.map(([x, y], i) => (
        <g key={i} className={`mv__src ${i < lit ? 'is-lit' : ''}`}>
          {i < lit && <path d={`M${x},${y} L130,64`} className="mv__link" />}
          <circle cx={x} cy={y} r="2.6" />
        </g>
      ))}
      <circle cx="130" cy="64" r="3.2" className="mv__origin" />
      <text x="254" y="12" textAnchor="end" className="mv__k">
        {lit ? `${lit} sources` : 'sources'}
      </text>
    </svg>
  )
}

/* ---- Outreach: a message progresses through the sequence ---- */
const STEPS_O = ['Email', 'Follow-up', 'Booking']
function Outreach(p: P) {
  const g = progress(p)
  const xs = [44, 130, 216]
  const active = p.phase === 'processing' ? p.step : -1
  return (
    <svg viewBox="0 0 260 64" className={`mv mv--outreach ${p.phase === 'processing' ? 'is-run' : ''}`} aria-hidden="true">
      <path d="M44,28 H216" className="mv__rail" />
      <path d="M44,28 H216" className="mv__rail-fill" style={{ ['--k' as string]: g / 2 > 1 ? 1 : g / 2 }} />
      {xs.map((x, i) => (
        <g key={i} className={`mv__stop ${i < g ? 'is-done' : ''} ${i === active ? 'is-active' : ''}`}>
          <rect x={x - 13} y={18} width="26" height="20" rx="6" />
          <path d={`M${x - 7},24 l7,5 7,-5`} className="mv__env" />
          <text x={x} y="56" textAnchor="middle" className="mv__lbl">
            {STEPS_O[i]}
          </text>
        </g>
      ))}
      {active >= 0 && (
        <circle key={`pk${active}`} r="3" cy="28" className="mv__packet" style={{ ['--x0' as string]: `${xs[active] - 34}px`, ['--x1' as string]: `${xs[active]}px` }} />
      )}
    </svg>
  )
}

/* ---- Analysis: bars resolve, the trend draws, the insight is marked ---- */
const BARS = [18, 26, 22, 32, 28, 38, 34, 46]
function Analysis(p: P) {
  const g = progress(p)
  const pts = BARS.map((h, i) => [22 + i * 30, 58 - h] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y - 6}`).join(' ')
  return (
    <svg viewBox="0 0 260 64" className={`mv mv--analysis ${p.phase === 'processing' ? 'is-run' : ''} g-${g}`} aria-hidden="true">
      <path d="M8,58 H252" className="mv__grid" />
      {BARS.map((h, i) => (
        <rect key={i} x={14 + i * 30} y={58 - h} width="16" height={h} rx="3" className={`mv__bar ${i === BARS.length - 1 ? 'is-last' : ''}`} style={{ ['--i' as string]: i }} />
      ))}
      <path d={line} className="mv__trend" pathLength={1} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y - 6} r="2.2" className={`mv__pt ${i === pts.length - 1 ? 'is-last' : ''}`} />
      ))}
      <line x1="0" x2="0" y1="4" y2="58" className="mv__scan" />
      <text x="8" y="10" className="mv__k">
        {g >= 3 ? 'report ready' : 'sample data'}
      </text>
    </svg>
  )
}

/* ---- Compliance: the document is read, criteria are checked, a summary is verified ---- */
const CRIT = ['Policy', 'Tone', 'Data use']
function Compliance(p: P) {
  const g = progress(p)
  return (
    <svg viewBox="0 0 260 64" className={`mv mv--compliance ${p.phase === 'processing' && p.step === 0 ? 'is-read' : ''}`} aria-hidden="true">
      <g className="mv__doc">
        <path d="M12,4 h44 l10,10 v46 a2,2 0 0 1 -2,2 h-52 a2,2 0 0 1 -2,-2 v-54 a2,2 0 0 1 2,-2 z" className="mv__page" />
        <path d="M56,4 v10 h10" className="mv__grid" />
        {[16, 24, 32, 40, 48].map((y, i) => (
          <path key={y} d={`M18,${y} H${i % 2 ? 50 : 58}`} className={`mv__ln ${g >= 1 && i === 2 ? 'is-hl' : ''}`} />
        ))}
        <rect x="10" y="4" width="58" height="3" className="mv__read" />
      </g>
      {CRIT.map((c, i) => {
        const done = g > i
        return (
          <g key={c} className={`mv__crit ${done ? 'is-done' : ''}`} transform={`translate(88 ${12 + i * 18})`}>
            <rect x="0" y="-7" width="14" height="14" rx="4" />
            <path d="m3.6 0.2 2.4 2.4 4.4-4.6" className="mv__tick" pathLength={1} />
            <text x="22" y="4" className="mv__lbl">
              {c}
            </text>
          </g>
        )
      })}
      <g className={`mv__shield ${g >= 3 ? 'is-ok' : ''}`} transform="translate(214 32)">
        <path d="M0,-20 L17,-13 V0 C17,10 9,17 0,20 C-9,17 -17,10 -17,0 V-13 Z" />
        <path d="m-6.5 0.5 4.5 4.5 9-9.5" className="mv__tick" pathLength={1} />
      </g>
    </svg>
  )
}

const MAP: Record<ModuleId, (p: P) => React.ReactElement> = { research: Research, outreach: Outreach, analysis: Analysis, compliance: Compliance }
export default function MicroVis({ id, phase, step }: { id: ModuleId; phase: Phase; step: number }) {
  const V = MAP[id]
  return <V phase={phase} step={step} />
}
