import { Glyph } from './glyphs'
/* One stroke family: 24px grid, 1.6 stroke, round caps. Decorative → aria-hidden. */
type P = { className?: string }
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconAgents = (p: P) => <Glyph name="agent" size={22} className={p.className} />

export const IconWorkflow = (p: P) => <Glyph name="automation" size={22} className={p.className} />

export const IconConsultant = (p: P) => <Glyph name="consultant" size={22} className={p.className} />

export const IconWebApp = (p: P) => <Glyph name="webapp" size={22} className={p.className} />

export const IconArrow = (p: P) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconArrowUpRight = (p: P) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

export const IconSearch = (p: P) => <Glyph name="search" size={22} className={p.className} />

export const IconMenu = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
)

export const IconClose = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
