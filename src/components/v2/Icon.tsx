/**
 * V2 functional icon set — 24px grid, 1.5px stroke, round joins.
 * Geometry is built from the same few primitives (arcs, 45° diagonals,
 * 2px corner radii) so every glyph shares one optical weight.
 * Decorative "hero" objects are 3D (see three/core); UI icons stay vector.
 */
type P = { className?: string; title?: string }
const Svg = ({ className = '', title, children }: P & { children: React.ReactNode }) => (
  <svg className={`v-ico ${className}`} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
    {title && <title>{title}</title>}
    {children}
  </svg>
)

export const IArrow = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)
export const IArrowUpRight = (p: P) => (
  <Svg {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Svg>
)
export const IArrowDown = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
)
export const IMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 9h16M4 15h10" />
  </Svg>
)
export const IClose = (p: P) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)
/* capability glyphs */
export const IAgents = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="8" width="14" height="10" rx="3" />
    <path d="M12 8V5M9.5 13h.01M14.5 13h.01M3 12v2M21 12v2" />
  </Svg>
)
export const IWorkflow = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="6" height="6" rx="2" />
    <rect x="15" y="14" width="6" height="6" rx="2" />
    <path d="M9 7h4a2 2 0 0 1 2 2v5" />
  </Svg>
)
export const IConsultant = (p: P) => (
  <Svg {...p}>
    <path d="M4 17V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 4Z" />
    <path d="M9 10h6" />
  </Svg>
)
export const IWebApp = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="13" height="11" rx="2" />
    <rect x="15" y="9" width="6" height="11" rx="2" />
    <path d="M3 8h13" />
  </Svg>
)
export const IResearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5M8.5 11h5" />
  </Svg>
)
