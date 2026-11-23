/* ==========================================================================
   Assessment sculptures — four bespoke isometric icons, one material family
   · projection: true isometric (30°), unit = 1 viewBox px, viewBox 80×80
   · light: top-left key. Top faces brightest, left faces mid, right faces
     darkest; front top edges carry a 0.6px specular line
   · lime marks the element that matters (the current signal), cyan the
     supporting structure, glass plates ground every sculpture
   · motion is SMIL inside the SVG (paused off-screen / reduced motion)
   ========================================================================== */
import type { ReactNode } from 'react'

const C30 = Math.cos(Math.PI / 6)
const OX = 40
const OY = 40

type P = [number, number]
/** iso projection: x runs right-down, y runs left-down, z up */
function iso(x: number, y: number, z: number, oy = OY): P {
  return [OX + (x - y) * C30, oy + (x + y) * 0.5 - z]
}
const pts = (a: P[]) => a.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')

type Tone = 'lime' | 'cyan' | 'glass' | 'dark'
const TONES: Record<Tone, { top: string; left: string; right: string }> = {
  lime: { top: 'url(#sc-top-lime)', left: 'url(#sc-left-lime)', right: 'url(#sc-right-lime)' },
  cyan: { top: 'url(#sc-top-cyan)', left: 'url(#sc-left-cyan)', right: 'url(#sc-right)' },
  glass: { top: 'url(#sc-top-glass)', left: 'url(#sc-left-glass)', right: 'url(#sc-right-glass)' },
  dark: { top: 'url(#sc-top-dark)', left: 'url(#sc-left-glass)', right: 'url(#sc-right)' },
}

/** box with its base corner at (x,y,z): w along x, d along y, h up */
function Prism({ x, y, z = 0, w, d, h, tone, oy = OY, className, edge = true }: { x: number; y: number; z?: number; w: number; d: number; h: number; tone: Tone; oy?: number; className?: string; edge?: boolean }) {
  const t = TONES[tone]
  const A = iso(x, y, z + h, oy)
  const B = iso(x + w, y, z + h, oy)
  const Cc = iso(x + w, y + d, z + h, oy)
  const D = iso(x, y + d, z + h, oy)
  const Bb = iso(x + w, y, z, oy)
  const Cb = iso(x + w, y + d, z, oy)
  const Db = iso(x, y + d, z, oy)
  return (
    <g className={className}>
      <polygon points={pts([D, Cc, Cb, Db])} fill={t.left} />
      <polygon points={pts([Cc, B, Bb, Cb])} fill={t.right} />
      <polygon points={pts([A, B, Cc, D])} fill={t.top} />
      {edge && <polyline points={pts([D, Cc, B])} className="sc-spec" />}
      <polyline points={pts([D, A, B])} className="sc-rim" />
    </g>
  )
}

/** iso circle (ellipse) centred at (x,y,z) with radius r on the ground plane */
function isoEllipse(x: number, y: number, z: number, r: number, oy = OY) {
  const [cx, cy] = iso(x, y, z, oy)
  return { cx, cy, rx: r * C30 * Math.SQRT2, ry: r * 0.5 * Math.SQRT2 }
}

export function SculptureDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sc-top-lime" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6ffd9" />
          <stop offset="0.45" stopColor="#d8ff4d" />
          <stop offset="1" stopColor="#a6dc00" />
        </linearGradient>
        <linearGradient id="sc-left-lime" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc400" />
          <stop offset="1" stopColor="#3f5c00" />
        </linearGradient>
        <linearGradient id="sc-right-lime" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b5400" />
          <stop offset="1" stopColor="#162400" />
        </linearGradient>
        <linearGradient id="sc-top-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset="0.5" stopColor="#7ff0ff" />
          <stop offset="1" stopColor="#2fc6dc" />
        </linearGradient>
        <linearGradient id="sc-left-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#27a9b8" />
          <stop offset="1" stopColor="#0d4d55" />
        </linearGradient>
        <linearGradient id="sc-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f3a3c" />
          <stop offset="1" stopColor="#061a17" />
        </linearGradient>
        <linearGradient id="sc-top-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(232 255 245 / 0.26)" />
          <stop offset="1" stopColor="rgb(232 255 245 / 0.06)" />
        </linearGradient>
        <linearGradient id="sc-left-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(61 232 255 / 0.22)" />
          <stop offset="1" stopColor="rgb(61 232 255 / 0.04)" />
        </linearGradient>
        <linearGradient id="sc-right-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(232 255 245 / 0.08)" />
          <stop offset="1" stopColor="rgb(232 255 245 / 0.01)" />
        </linearGradient>
        <linearGradient id="sc-top-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c3a2c" />
          <stop offset="1" stopColor="#0a1c14" />
        </linearGradient>
        <radialGradient id="sc-orb" cx="36%" cy="32%" r="70%">
          <stop offset="0" stopColor="#fbffe8" />
          <stop offset="0.18" stopColor="#e8ff7a" />
          <stop offset="0.4" stopColor="#c6ff00" />
          <stop offset="0.7" stopColor="#4a7d0c" />
          <stop offset="1" stopColor="#0c2410" />
        </radialGradient>
        <radialGradient id="sc-orb-rim" cx="72%" cy="80%" r="42%">
          <stop offset="0.55" stopColor="rgb(61 232 255 / 0)" />
          <stop offset="1" stopColor="rgb(61 232 255 / 0.3)" />
        </radialGradient>
        <radialGradient id="sc-shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.65" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sc-spark">
          <stop offset="0" stopColor="#fbffe0" />
          <stop offset="0.35" stopColor="rgb(198 255 0 / 0.9)" />
          <stop offset="1" stopColor="rgb(198 255 0 / 0)" />
        </radialGradient>
        <linearGradient id="sc-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(61 232 255 / 0)" />
          <stop offset="1" stopColor="rgb(61 232 255 / 0.3)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg className="sc" viewBox="0 0 80 80" role="img" aria-label={label}>
      {children}
    </svg>
  )
}

function GroundShadow({ x = 0, y = 0, r = 26, oy = OY }: { x?: number; y?: number; r?: number; oy?: number }) {
  const e = isoEllipse(x, y, 0, r, oy)
  return <ellipse cx={e.cx} cy={e.cy + 3} rx={e.rx} ry={e.ry} fill="url(#sc-shadow)" />
}

/* ---------------------------------------------------------------------------
   01 · Business & Industry — a small district of towers on a survey plate;
   a scanning ring sweeps over them, the tallest (lime) is the business
--------------------------------------------------------------------------- */
export function SculptureBusiness({ animate }: { animate: boolean }) {
  const oy = 47
  const ring = isoEllipse(1, 1, 27, 15, oy)
  return (
    <Frame label="Business and industry research">
      <GroundShadow r={27} oy={oy} />
      <Prism x={-19} y={-19} w={38} d={38} h={3} tone="glass" oy={oy} />
      {/* survey grid on the plate */}
      {[-9.5, 0, 9.5].map((k) => (
        <g key={k} className="sc-grid">
          <polyline points={pts([iso(k, -19, 3, oy), iso(k, 19, 3, oy)])} />
          <polyline points={pts([iso(-19, k, 3, oy), iso(19, k, 3, oy)])} />
        </g>
      ))}
      {/* towers back → front so they occlude correctly */}
      <Prism x={-14} y={-14} w={9} d={9} h={13} tone="cyan" z={3} oy={oy} />
      <Prism x={4} y={-15} w={9} d={9} h={18} tone="cyan" z={3} oy={oy} />
      <Prism x={-15} y={4} w={9} d={9} h={9} tone="dark" z={3} oy={oy} />
      <Prism x={-3} y={-3} w={10} d={10} h={27} tone="lime" z={3} oy={oy} className="sc-hero" />
      {/* window slits on the lit tower */}
      {[9, 14, 19, 24].map((zz) => (
        <polyline key={zz} className="sc-slit" points={pts([iso(-1.5, 7, zz, oy), iso(4.5, 7, zz, oy)])} />
      ))}
      <Prism x={6} y={5} w={8} d={8} h={6} tone="glass" z={3} oy={oy} />
      {/* scanning ring */}
      <g className="sc-ring">
        <ellipse cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} className="sc-ring__line" />
        <ellipse cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} className="sc-ring__arc" pathLength={100} />
        <circle r="1.8" fill="url(#sc-spark)" className="sc-ring__dot">
          {animate && <animateMotion dur="6s" repeatCount="indefinite" path={`M${ring.cx - ring.rx},${ring.cy} a${ring.rx},${ring.ry} 0 1,0 ${ring.rx * 2},0 a${ring.rx},${ring.ry} 0 1,0 ${-ring.rx * 2},0`} />}
        </circle>
      </g>
      {!animate && <circle cx={ring.cx - ring.rx * 0.7} cy={ring.cy + ring.ry * 0.7} r="1.8" fill="url(#sc-spark)" />}
    </Frame>
  )
}

/* ---------------------------------------------------------------------------
   02 · Problems & Tools — three tool blocks piped into a hub; data flows on
   two pipes, the third is broken by a manual step (lime fault marker)
--------------------------------------------------------------------------- */
export function SculptureSystems({ animate }: { animate: boolean }) {
  const oy = 44
  const z = 3
  const hub = iso(0, 0, z + 12, oy)
  const a = iso(-15, -13, z + 7, oy) // back-left tool
  const b = iso(14, -13, z + 7, oy) // back-right tool
  const c = iso(-2, 16, z + 7, oy) // front tool (broken link)
  const pipe = (p: P, q: P) => `M${p[0].toFixed(1)},${p[1].toFixed(1)} Q${((p[0] + q[0]) / 2).toFixed(1)},${(Math.min(p[1], q[1]) - 6).toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}`
  const pa = pipe(a, hub)
  const pb = pipe(b, hub)
  const pc = pipe(c, hub)
  return (
    <Frame label="Problems and tools mapping">
      <GroundShadow r={28} oy={oy} />
      <Prism x={-20} y={-20} w={40} d={40} h={3} tone="glass" oy={oy} />
      <Prism x={-19} y={-17} w={8} d={8} h={7} tone="cyan" z={z} oy={oy} />
      <Prism x={10} y={-17} w={8} d={8} h={7} tone="cyan" z={z} oy={oy} />
      {/* pipes sit above the back tools, behind the hub */}
      <path d={pa} className="sc-pipe" />
      <path d={pb} className="sc-pipe" />
      <Prism x={-6} y={-6} w={12} d={12} h={12} tone="lime" z={z} oy={oy} className="sc-hero" />
      <Prism x={-6} y={12} w={8} d={8} h={7} tone="dark" z={z} oy={oy} />
      {/* broken pipe from the front tool */}
      <path d={pc} className="sc-pipe sc-pipe--broken" />
      <g transform={`translate(${((c[0] + hub[0]) / 2).toFixed(1)} ${((Math.min(c[1], hub[1]) - 6 + (c[1] + hub[1]) / 2) / 2).toFixed(1)})`} className="sc-fault">
        <circle r="5" className="sc-fault__halo" />
        <rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1.2" transform="rotate(45)" className="sc-fault__mark" />
      </g>
      {[pa, pb].map((d, i) => (
        <circle key={i} r="1.6" fill="url(#sc-spark)" className="sc-flow" cx={animate ? undefined : i ? b[0] : a[0]} cy={animate ? undefined : i ? b[1] : a[1]}>
          {animate && <animateMotion dur="2.4s" begin={`${i * 1.2}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />}
        </circle>
      ))}
    </Frame>
  )
}

/* ---------------------------------------------------------------------------
   03 · Marketing & Social — three floating data layers; the top layer
   carries a rising trend line ending in a lime signal, social signals
   (rings) rise from the stack
--------------------------------------------------------------------------- */
export function SculptureMarketing({ animate }: { animate: boolean }) {
  const oy = 46
  const L = (z: number) => z
  const trend: [number, number][] = [
    [-14, 10],
    [-8, 4],
    [-2, 6],
    [4, -2],
    [10, -8],
    [14, -14],
  ]
  // the line lives on the top layer surface: x along the layer, rise along -y
  const topZ = 22
  const line = trend.map(([x, y]) => iso(x, y, topZ + 0.4, oy))
  const bars = [
    { x: -12, h: 4 },
    { x: -5, h: 7 },
    { x: 2, h: 5 },
    { x: 9, h: 9 },
  ]
  const end = line[line.length - 1]
  return (
    <Frame label="Marketing and social presence review">
      <GroundShadow r={24} oy={oy} />
      <Prism x={-17} y={-17} w={34} d={34} h={2} tone="glass" z={L(0)} oy={oy} />
      {/* middle layer: dimensional bars */}
      <Prism x={-17} y={-17} w={34} d={34} h={1.6} tone="glass" z={L(10)} oy={oy} edge={false} />
      {bars.map((b) => (
        <Prism key={b.x} x={b.x} y={6} w={4} d={4} h={b.h} tone={b.x === 9 ? 'lime' : 'cyan'} z={11.6} oy={oy} />
      ))}
      {/* top layer: trend */}
      <g className="sc-layer-top">
        <Prism x={-17} y={-17} w={34} d={34} h={1.6} tone="glass" z={topZ - 1.6} oy={oy} />
        <polyline points={pts(line)} className="sc-trend" />
        <polygon points={pts([...line, iso(14, 14, topZ + 0.2, oy), iso(-14, 14, topZ + 0.2, oy)])} className="sc-trend-fill" />
        <circle cx={end[0]} cy={end[1]} r="4.5" className="sc-ping">
          {animate && <animate attributeName="r" values="2;6;2" dur="2.8s" repeatCount="indefinite" />}
          {animate && <animate attributeName="opacity" values="0.8;0;0.8" dur="2.8s" repeatCount="indefinite" />}
        </circle>
        <circle cx={end[0]} cy={end[1]} r="2.2" className="sc-node" />
      </g>
      {/* social signals: small orbs rising off the stack */}
      {[
        { x: 20, y: -6, z: 30, r: 2.4, d: 0 },
        { x: 22, y: 6, z: 24, r: 1.7, d: 1.3 },
      ].map((o, i) => {
        const p = iso(o.x, o.y, o.z, oy)
        return (
          <circle key={i} cx={p[0]} cy={p[1]} r={o.r} className="sc-bubble">
            {animate && <animate attributeName="cy" values={`${p[1]};${p[1] - 3};${p[1]}`} dur="4.2s" begin={`${o.d}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />}
          </circle>
        )
      })}
    </Frame>
  )
}

/* ---------------------------------------------------------------------------
   04 · AI & Automation — an intelligence core on a pedestal, a tilted orbit
   passing behind and in front of it, three solution modules docked around
--------------------------------------------------------------------------- */
export function SculptureAI({ animate }: { animate: boolean }) {
  const oy = 48
  const disk = isoEllipse(0, 0, 4, 16, oy)
  const diskB = isoEllipse(0, 0, 0, 16, oy)
  const core = iso(0, 0, 22, oy)
  const R = 11.5
  // orbit: ellipse around the core, tilted
  const orx = 23
  const ory = 7.5
  const tilt = -16
  const mods: { x: number; y: number; tone: Tone }[] = [
    { x: -19, y: -4, tone: 'cyan' },
    { x: 13, y: -16, tone: 'cyan' },
    { x: 10, y: 11, tone: 'dark' },
  ]
  return (
    <Frame label="AI and automation opportunities">
      <GroundShadow r={25} oy={oy} />
      {/* modules sit on the ground, linked to the pedestal */}
      {mods.map((m, i) => {
        const p = iso(m.x + 2.5, m.y + 2.5, 5, oy)
        return <polyline key={`l${i}`} points={pts([p, iso(m.x * 0.45, m.y * 0.45, 4, oy)])} className="sc-link" />
      })}
      {mods.slice(0, 2).map((m, i) => (
        <Prism key={i} x={m.x} y={m.y} w={5} d={5} h={5} tone={m.tone} oy={oy} />
      ))}
      {/* pedestal */}
      <path d={`M${diskB.cx - diskB.rx},${diskB.cy} A${diskB.rx},${diskB.ry} 0 0,0 ${diskB.cx + diskB.rx},${diskB.cy} L${disk.cx + disk.rx},${disk.cy} A${disk.rx},${disk.ry} 0 0,1 ${disk.cx - disk.rx},${disk.cy} Z`} fill="url(#sc-left-cyan)" />
      <ellipse cx={disk.cx} cy={disk.cy} rx={disk.rx} ry={disk.ry} fill="url(#sc-top-dark)" className="sc-disk" />
      <ellipse cx={disk.cx} cy={disk.cy} rx={disk.rx * 0.62} ry={disk.ry * 0.62} className="sc-disk-ring" />
      {/* orbit, back half */}
      <g transform={`rotate(${tilt} ${core[0]} ${core[1]})`}>
        <path d={`M${core[0] - orx},${core[1]} A${orx},${ory} 0 0,1 ${core[0] + orx},${core[1]}`} className="sc-orbit sc-orbit--back" />
      </g>
      {/* core */}
      <ellipse cx={core[0]} cy={core[1] + R + 3} rx={R * 0.9} ry={2.2} fill="url(#sc-shadow)" opacity="0.7" />
      <circle cx={core[0]} cy={core[1]} r={R} fill="url(#sc-orb)" className="sc-core" />
      <circle cx={core[0]} cy={core[1]} r={R} fill="url(#sc-orb-rim)" />
      <path d={`M${core[0] - R * 0.62},${core[1] - R * 0.42} A${R * 0.75},${R * 0.75} 0 0,1 ${core[0] + R * 0.1},${core[1] - R * 0.78}`} className="sc-core-spec" />
      {/* orbit, front half + carrier */}
      <g transform={`rotate(${tilt} ${core[0]} ${core[1]})`}>
        <path d={`M${core[0] + orx},${core[1]} A${orx},${ory} 0 0,1 ${core[0] - orx},${core[1]}`} className="sc-orbit" />
        <circle r="1.9" fill="url(#sc-spark)" cx={animate ? undefined : core[0] - orx * 0.5} cy={animate ? undefined : core[1] + ory * 0.86}>
          {animate && <animateMotion dur="3.6s" repeatCount="indefinite" path={`M${core[0] + orx},${core[1]} A${orx},${ory} 0 0,1 ${core[0] - orx},${core[1]}`} />}
          {animate && <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="3.6s" repeatCount="indefinite" />}
        </circle>
      </g>
      {/* front module in front of everything */}
      <Prism x={mods[2].x} y={mods[2].y} w={5} d={5} h={5} tone="lime" oy={oy} />
    </Frame>
  )
}
