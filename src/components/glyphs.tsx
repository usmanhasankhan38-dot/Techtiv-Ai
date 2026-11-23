/* ==========================================================================
   TechtivAI glyph system
   - 24 × 24 grid, 2px live-area padding, 1.5 stroke, round caps & joins
   - one optical weight at every size (vector-effect keeps stroke constant)
   - currentColor only: states are colour changes, never shape changes
   ========================================================================== */
import type { SVGProps } from 'react'

export type GlyphName =
  | 'agent' | 'automation' | 'chatbot' | 'webapp' | 'ml' | 'consultant'
  | 'crm' | 'inbox' | 'sheets' | 'booking' | 'invoice'
  | 'scan' | 'globe' | 'social' | 'spark' | 'chart' | 'search'
  | 'trigger' | 'brain' | 'link' | 'action' | 'optimize'
  | 'mail' | 'doc' | 'finance' | 'people' | 'warning'

const P: Record<GlyphName, React.ReactNode> = {
  agent: (
    <>
      <rect x="4.75" y="8.25" width="14.5" height="11" rx="3.5" />
      <path d="M12 8.25V5.5" />
      <circle cx="12" cy="4.25" r="1.25" />
      <path d="M9.25 13.25v.5M14.75 13.25v.5M9.75 16.5h4.5M2.75 12.5v2.5M21.25 12.5v2.5" />
    </>
  ),
  automation: (
    <>
      <rect x="3.25" y="3.25" width="6.5" height="6.5" rx="2" />
      <rect x="14.25" y="14.25" width="6.5" height="6.5" rx="2" />
      <path d="M9.75 6.5h3.5a4 4 0 0 1 4 4v3.75" />
      <path d="m15.25 12.25 2 2 2-2" />
      <path d="M6.5 13.5v1.75a3 3 0 0 0 3 3h1.75" />
    </>
  ),
  chatbot: (
    <>
      <path d="M20.25 11.5a7.75 7.75 0 0 1-11.3 6.9L4 19.75l1.4-4.4a7.75 7.75 0 1 1 14.85-3.85Z" />
      <path d="M8.75 11.75h.01M12 11.75h.01M15.25 11.75h.01" strokeWidth="2.25" />
    </>
  ),
  webapp: (
    <>
      <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2.25" />
      <path d="M2.75 7.75h14.5M5.25 6h.01M7.25 6h.01" />
      <rect x="15.25" y="9.75" width="6" height="10.5" rx="1.75" />
      <path d="M17.75 18.25h1M7.5 19.75h5" />
    </>
  ),
  ml: (
    <>
      <circle cx="5" cy="7" r="1.75" />
      <circle cx="5" cy="17" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="6" r="1.75" />
      <circle cx="19" cy="18" r="1.75" />
      <path d="m6.5 8 4 3M6.5 16l4-3M13.6 11.1l3.9-4.1M13.6 12.9l3.9 4.1" />
    </>
  ),
  consultant: (
    <>
      <path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="M9 10.25h6M9 13.25h3.75" />
    </>
  ),
  crm: (
    <>
      <rect x="3.25" y="4.75" width="17.5" height="14.5" rx="2.75" />
      <circle cx="9" cy="10.5" r="2.25" />
      <path d="M5.75 16.25a3.4 3.4 0 0 1 6.5 0M14.25 9.5h3.5M14.25 12.5h3.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.25 13.25 5.6 6.1a2 2 0 0 1 1.9-1.35h9a2 2 0 0 1 1.9 1.35l2.35 7.15" />
      <path d="M3.25 13.25v4.5a1.5 1.5 0 0 0 1.5 1.5h14.5a1.5 1.5 0 0 0 1.5-1.5v-4.5h-5l-1.25 2.25h-4.5L8.25 13.25h-5Z" />
    </>
  ),
  sheets: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="2.75" />
      <path d="M3.25 9h17.5M3.25 14.75h17.5M9.25 3.25v17.5" />
    </>
  ),
  booking: (
    <>
      <rect x="3.25" y="5" width="17.5" height="15.25" rx="2.75" />
      <path d="M3.25 9.75h17.5M8 3.25v3.5M16 3.25v3.5" />
      <path d="m9.25 15 2 2 3.75-4" />
    </>
  ),
  invoice: (
    <>
      <path d="M6.25 2.75h8.5l4 4v13.5a1 1 0 0 1-1.5.85l-1.5-.95-1.75 1.1-1.75-1.1-1.75 1.1-1.75-1.1-1.5.95a1 1 0 0 1-1.5-.85V4.25a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.75 9.25h6.5M8.75 12.75h6.5M8.75 16.25h3.5" />
    </>
  ),
  scan: (
    <>
      <path d="M3.25 8V5.75a2.5 2.5 0 0 1 2.5-2.5H8M16 3.25h2.25a2.5 2.5 0 0 1 2.5 2.5V8M20.75 16v2.25a2.5 2.5 0 0 1-2.5 2.5H16M8 20.75H5.75a2.5 2.5 0 0 1-2.5-2.5V16" />
      <path d="M3.25 12h17.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M3.25 12h17.5M12 3.25c2.4 2.4 3.6 5.3 3.6 8.75S14.4 18.35 12 20.75C9.6 18.35 8.4 15.45 8.4 12S9.6 5.65 12 3.25Z" />
    </>
  ),
  social: (
    <>
      <circle cx="17.5" cy="5.75" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17.5" cy="18.25" r="2.5" />
      <path d="m8.7 10.75 6.6-3.75M8.7 13.25l6.6 3.75" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2.75c.6 4.9 2.85 7.65 8.25 9.25-5.4 1.6-7.65 4.35-8.25 9.25-.6-4.9-2.85-7.65-8.25-9.25C9.15 10.4 11.4 7.65 12 2.75Z" />
    </>
  ),
  chart: (
    <>
      <path d="M3.25 3.25v15.5a2 2 0 0 0 2 2h15.5" />
      <path d="m7.25 15 3.75-4.25 3 2.75 5.25-6.25" />
    </>
  ),
  search: (
    <>
      <circle cx="10.75" cy="10.75" r="6.75" />
      <path d="m20.75 20.75-5.25-5.25" />
    </>
  ),
  trigger: <path d="M13.25 2.75 4.75 13.5h6.5l-1 7.75 8.5-10.75h-6.5l1-7.75Z" />,
  brain: (
    <>
      <path d="M9 4.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 4.5 13a3 3 0 0 0 2 2.8V16a3 3 0 0 0 5.5 1.6V6A2.5 2.5 0 0 0 9 4.5Z" />
      <path d="M15 4.5a3 3 0 0 1 3 3v.3A3 3 0 0 1 19.5 13a3 3 0 0 1-2 2.8V16a3 3 0 0 1-5.5 1.6V6A2.5 2.5 0 0 1 15 4.5Z" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  action: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.5 12.25 2.4 2.4 4.85-5.05" />
    </>
  ),
  optimize: <path d="M5 19.25V11.5M10 19.25V5.75M15 19.25v-5M20 19.25V9" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.75" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  finance: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.75" />
      <path d="M3 10.25h18M7 15h3" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.6a3 3 0 0 1 0 5.8M17.5 14.2a5.5 5.5 0 0 1 3 4.8" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 4.1 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 16.75h.01" />
    </>
  ),
}

type Props = { name: GlyphName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>

export function Glyph({ name, size = 20, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {P[name]}
    </svg>
  )
}

/* Same glyph as an SVG <g> for use inside larger SVG drawings (centred at 0,0). */
export function GlyphG({ name, size = 16, ...rest }: { name: GlyphName; size?: number } & SVGProps<SVGGElement>) {
  const s = size / 24
  return (
    <g transform={`translate(${-size / 2} ${-size / 2}) scale(${s})`} fill="none" stroke="currentColor" strokeWidth={1.3 / s} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {P[name]}
    </g>
  )
}
