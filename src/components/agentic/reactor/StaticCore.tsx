import { geodesicSvgPaths } from './geodesic'

/* No WebGL: a still drawing of the same three lattices and the lit core. */
let cachedPaths: ReturnType<typeof geodesicSvgPaths> | null = null
export default function StaticCore() {
  const p = (cachedPaths ??= geodesicSvgPaths(100))
  return (
    <svg className="core__static" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="cs-core" cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#0a2326" />
          <stop offset="0.86" stopColor="#3de8ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e8ffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {p.inner.map((e, i) => <path key={`i${i}`} d={e.d} stroke="#101514" strokeWidth="0.5" opacity={e.front ? 0.9 : 0.35} />)}
      <circle cx="50" cy="50" r="20" fill="url(#cs-core)" />
      {p.mid.map((e, i) => <path key={`m${i}`} d={e.d} stroke="#2f6a5a" strokeWidth="0.45" opacity={e.front ? 0.85 : 0.3} />)}
      {p.outer.map((e, i) => <path key={`o${i}`} d={e.d} stroke="#c2cbc7" strokeWidth="0.7" strokeLinecap="round" opacity={e.front ? 0.9 : 0.22} />)}
    </svg>
  )
}
