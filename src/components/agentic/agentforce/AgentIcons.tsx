import type { ModuleId } from '../agenticData'

/* ==========================================================================
   AgentForce icon family
   · one 32-unit grid, 1.5 stroke, round caps/joins, 2.5 corner radii
   · each silhouette is distinct: lens (research), trajectory (outreach),
     stepped bars (analysis), page + shield (compliance)
   · `.afi__live` parts carry the motion; they animate only while the
     console is active (CSS), otherwise they rest in a finished pose
   ========================================================================== */

function Research() {
  return (
    <>
      {/* discovery lens with mapped sources inside */}
      <circle cx="14" cy="14" r="8.5" />
      <path d="M20.2 20.2 26.5 26.5" />
      <circle cx="11" cy="12" r="1.3" className="afi__fill" />
      <circle cx="17" cy="11" r="1.3" className="afi__fill" />
      <circle cx="14.5" cy="17.2" r="1.3" className="afi__fill afi__accent" />
      <path d="M11 12 17 11 14.5 17.2Z" className="afi__thin" />
      <circle cx="14" cy="14" r="8.5" className="afi__live afi__ping" />
    </>
  )
}

function Outreach() {
  return (
    <>
      {/* directional trajectory: message leaves, arcs, lands on a target */}
      <path d="M5 23c5-1 8-5 10.5-9.5S21 6.5 26 6" className="afi__thin afi__dash" />
      <path d="M21.5 4.5 26.5 6 25 11" />
      <rect x="4" y="19.5" width="7.5" height="6.5" rx="2" />
      <path d="m4.6 20.4 3.15 2.6 3.15-2.6" className="afi__thin" />
      <circle r="1.6" className="afi__fill afi__accent afi__live afi__travel" />
    </>
  )
}

function Analysis() {
  return (
    <>
      {/* stepped bars rising into an insight node */}
      <path d="M5 27h22" className="afi__thin" />
      <rect x="6" y="18" width="4" height="9" rx="1.2" className="afi__live afi__bar afi__bar--1" />
      <rect x="12.5" y="14" width="4" height="13" rx="1.2" className="afi__live afi__bar afi__bar--2" />
      <rect x="19" y="10" width="4" height="17" rx="1.2" className="afi__live afi__bar afi__bar--3" />
      <path d="M8 13.5 14.5 9.5 21 6" className="afi__thin" />
      <circle cx="25" cy="4.5" r="2" className="afi__fill afi__accent" />
    </>
  )
}

function Compliance() {
  return (
    <>
      {/* page with folded corner, verified by a shield */}
      <path d="M8 4.5h9.5l5 5V15" />
      <path d="M17.5 4.5v5h5" className="afi__thin" />
      <path d="M8 4.5A1.5 1.5 0 0 0 6.5 6v19A1.5 1.5 0 0 0 8 26.5h6" />
      <path d="M10 12h6M10 15.5h4" className="afi__thin" />
      <path d="M22.5 17.5 27 19.2v3.3c0 2.6-1.9 4.4-4.5 5.3-2.6-.9-4.5-2.7-4.5-5.3v-3.3Z" className="afi__accent-stroke" />
      <path d="m20.6 22.6 1.4 1.4 2.6-2.8" className="afi__live afi__check" pathLength={1} />
    </>
  )
}

const MAP: Record<ModuleId, () => React.ReactElement> = { research: Research, outreach: Outreach, analysis: Analysis, compliance: Compliance }

export default function AgentIcon({ id }: { id: ModuleId }) {
  const I = MAP[id]
  return (
    <svg className={`afi afi--${id}`} viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <I />
    </svg>
  )
}
