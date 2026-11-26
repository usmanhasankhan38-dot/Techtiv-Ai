import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { onTheme, themeState } from '../../lib/theme'

/* ==========================================================================
   Final CTA — three liquid-glass sculptures, one canvas.
   · Geometry: procedural parametric surfaces (no assets), seams welded and
     normals smoothed so the glass reads as one continuous body.
   · Material: MeshPhysicalMaterial transmission + clearcoat + dispersion,
     lit by a studio environment built from brand-coloured light panels
     (cyan key, lime rim, emerald fill, one neutral specular strip).
   · Motion: each sculpture has its own slow, non-repeating rhythm (summed
     incommensurate sines), plus damped pointer parallax and hover response.
   ========================================================================== */
export type CtaState = { px: number; py: number; inside: number; enter: number; exit: number; hover: number; /** 0–1: where the content ends (bottom of the CTAs) within the section */ cf: number }

type Fn = (u: number, v: number, out: THREE.Vector3) => void
function surface(fn: Fn, su: number, sv: number) {
  const pos: number[] = []
  const idx: number[] = []
  const p = new THREE.Vector3()
  for (let i = 0; i <= su; i++) {
    for (let j = 0; j <= sv; j++) {
      fn(i / su, j / sv, p)
      pos.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i < su; i++) {
    for (let j = 0; j < sv; j++) {
      const a = i * (sv + 1) + j
      const b = (i + 1) * (sv + 1) + j
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  let g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g = mergeVertices(g, 1e-4) // weld the u/v seams
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}
const TAU = Math.PI * 2

/* 01 · Organic intelligence — a ruffled ring: the tube swells and folds 7× */
const flower: Fn = (u, v, o) => {
  const a = u * TAU
  const b = v * TAU
  const R = 1 + 0.08 * Math.sin(7 * a)
  const r = 0.36 * (1 + 0.32 * Math.sin(7 * a + 0.6))
  const fold = 0.2 * Math.sin(7 * a) * Math.cos(b)
  o.set((R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b) + fold)
}

/* 02 · Transformation core — a torus whose elliptical section turns 3× as it
   travels, then layers fold back over themselves: a twisted liquid knot */
const core: Fn = (u, v, o) => {
  const a = u * TAU
  const b = v * TAU
  const tw = 3 * a // the cross-section rotates three times around the ring
  const ea = 0.62 + 0.08 * Math.sin(2 * a)
  const eb = 0.3
  const cx = ea * Math.cos(b)
  const cy = eb * Math.sin(b)
  const rx = cx * Math.cos(tw) - cy * Math.sin(tw)
  const ry = cx * Math.sin(tw) + cy * Math.cos(tw)
  const R = 1.05 + 0.12 * Math.sin(3 * a)
  o.set((R + rx) * Math.cos(a), (R + rx) * Math.sin(a), ry + 0.22 * Math.sin(2 * a))
}

/* 03 · Adaptive intelligence — a flat, wide band folded into three waves:
   a soft glass ribbon, unmistakably not a ring or a ball */
const ribbon: Fn = (u, v, o) => {
  const a = u * TAU
  const b = v * TAU
  const R = 0.86
  const w = 0.5 // band width
  const t = 0.13 // band thickness
  const x0 = w * Math.cos(b)
  const z0 = t * Math.sin(b)
  const wave = 0.42 * Math.sin(3 * a)
  const tilt = 0.5 * Math.cos(3 * a) // the band leans with each fold
  const rx = x0 * Math.cos(tilt) - z0 * Math.sin(tilt)
  const rz = x0 * Math.sin(tilt) + z0 * Math.cos(tilt)
  o.set((R + rx) * Math.cos(a), (R + rx) * Math.sin(a), rz + wave)
}

/* studio environment: dark room, brand-coloured light panels */
function useStudioEnv(light = false) {
  const gl = useThree((s) => s.gl)
  const env = useMemo(() => {
    const scene = new THREE.Scene()
    // light theme: a pale studio (same brand panels) so reflections match the page
    scene.background = new THREE.Color(light ? '#cfdcd4' : '#020806')
    const panel = (w: number, h: number, color: string, intensity: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }))
      m.position.set(...pos)
      m.lookAt(...look)
      scene.add(m)
    }
    panel(6, 3, '#3de8ff', 3.6, [-5, 4, 4]) // cyan key, top-left front
    panel(1.4, 7, '#c6ff00', 3, [6, 0, -2]) // lime rim, right behind
    panel(8, 2.4, '#14805a', 2.4, [0, -5, 2]) // emerald floor bounce
    panel(2.6, 0.6, '#ffffff', 6, [2, 5, 3]) // neutral specular strip
    panel(4, 4, '#0b3d4a', 1.2, [-6, -1, -4]) // deep teal fill
    const pm = new THREE.PMREMGenerator(gl)
    const rt = pm.fromScene(scene, 0.035)
    pm.dispose()
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      ;(m.material as THREE.Material | undefined)?.dispose?.()
    })
    return rt
  }, [gl, light])
  useEffect(() => () => env.dispose(), [env])
  return env.texture
}

type SpecItem = {
  geo: THREE.BufferGeometry
  color: string
  atten: string
  /* motion personality */
  spin: [number, number, number]
  bob: number
  phase: number
}

type Place = { x: number; y: number; z: number; k: number; from: [number, number] }
function Sculpture({ it, i, s, places }: { it: SpecItem; i: number; s: React.RefObject<CtaState>; places: React.RefObject<Place[]> }) {
  const g = useRef<THREE.Group>(null)
  const m = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshPhysicalMaterial>(null)
  const hov = useRef(0)
  const tilt = useRef({ x: 0, y: 0 })
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime + it.phase
    const S = s.current!
    const place = places.current![i]
    const d = Math.min(dt, 0.05)
    const target = S.hover === i ? 1 : 0
    hov.current += (target - hov.current) * (1 - Math.exp(-d * 5))
    // pointer tilt, damped — never follows the cursor, only leans toward it
    tilt.current.x += (S.py * 0.25 * S.inside - tilt.current.x) * (1 - Math.exp(-d * 2.5))
    tilt.current.y += (S.px * 0.35 * S.inside - tilt.current.y) * (1 - Math.exp(-d * 2.5))
    const e = S.enter
    const ease = 1 - Math.pow(1 - e, 3)
    const x = place.x + place.from[0] * (1 - ease) + S.px * 0.18 * S.inside * (i === 1 ? 0.6 : 1)
    const y = place.y + place.from[1] * (1 - ease) - S.exit * (1.2 + i * 0.3) + Math.sin(t * 0.55) * it.bob + Math.sin(t * 0.21) * it.bob * 0.6
    g.current!.position.set(x, y, place.z)
    const k = place.k * (0.82 + 0.18 * ease) * (1 + hov.current * 0.05) * (1 - S.exit * 0.12)
    g.current!.scale.setScalar(k)
    m.current!.rotation.set(
      it.spin[0] * t + Math.sin(t * 0.31) * 0.25 + tilt.current.x + hov.current * 0.15,
      it.spin[1] * t + Math.sin(t * 0.23) * 0.3 + tilt.current.y,
      it.spin[2] * t + Math.sin(t * 0.17) * 0.2 + (1 - ease) * 1.2,
    )
    mat.current!.envMapIntensity = 2.4 + hov.current * 0.9 + 0.25 * Math.sin(t * 0.4)
  })
  return (
    <group ref={g}>
      <mesh ref={m} geometry={it.geo}>
        <meshPhysicalMaterial
          ref={mat}
          color={it.color}
          transmission={1}
          thickness={0.75}
          ior={1.5}
          roughness={0.07}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          attenuationColor={it.atten}
          attenuationDistance={4.5}
          iridescence={0.18}
          iridescenceIOR={1.3}
          specularIntensity={1}
          envMapIntensity={2}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

/* an opaque backdrop in the page colour with soft pools of light: the glass
   refracts these, which is what makes it read as luminous rather than dark */
function Backdrop() {
  const camera = useThree((st) => st.camera)
  const size = useThree((st) => st.size)
  const [tex, texLight] = useMemo(() => {
    const paint = (light: boolean) => {
      const c = document.createElement('canvas')
      c.width = 512
      c.height = 512
      const x = c.getContext('2d')!
      x.fillStyle = light ? '#f2f6f1' : '#030d06'
      x.fillRect(0, 0, 512, 512)
      const pool = (cx: number, cy: number, r: number, col: string) => {
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, col)
        g.addColorStop(1, light ? 'rgba(242,246,241,0)' : 'rgba(3,13,6,0)')
        x.fillStyle = g
        x.fillRect(0, 0, 512, 512)
      }
      if (light) {
        // same pools, re-toned: tinted daylight instead of glow
        pool(256, 420, 240, 'rgba(40,175,160,0.34)') // teal under the core
        pool(110, 340, 160, 'rgba(130,190,0,0.26)') // lime, left
        pool(420, 300, 160, 'rgba(20,110,70,0.22)') // emerald, right
        pool(256, 470, 120, 'rgba(0,150,175,0.18)') // cyan floor
      } else {
        pool(256, 420, 240, 'rgba(40,175,160,0.7)') // teal under the core
        pool(110, 340, 160, 'rgba(160,220,0,0.36)') // lime, left
        pool(420, 300, 160, 'rgba(20,110,70,0.5)') // emerald, right
        pool(256, 470, 120, 'rgba(61,232,255,0.25)') // cyan floor
      }
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    return [paint(false), paint(true)]
  }, [])
  useEffect(
    () => () => {
      tex.dispose()
      texLight.dispose()
    },
    [tex, texLight],
  )
  // the light backdrop cross-fades over the dark one with the theme tween
  const lightMat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    const m = lightMat.current
    if (!m) return
    m.opacity = themeState.t
    m.visible = themeState.t > 0.001
  })
  const cam = camera as THREE.PerspectiveCamera
  const z = -7
  const hh = 2 * (cam.position.z - z) * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 1.25
  const ww = hh * (size.width / size.height)
  return (
    <group>
      <mesh position={[0, 0, z]} renderOrder={-2}>
        <planeGeometry args={[ww, hh]} />
        <meshBasicMaterial map={tex} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, z + 0.01]} renderOrder={-1}>
        <planeGeometry args={[ww, hh]} />
        <meshBasicMaterial ref={lightMat} map={texLight} toneMapped={false} depthWrite={false} transparent opacity={themeState.t} />
      </mesh>
    </group>
  )
}

/* adaptive quality: measure real frame time; step DPR down, then stop the
   loop (a still, finished render) rather than let the page stutter */
function PerfGuard({ onDegrade }: { onDegrade: () => void }) {
  const setDpr = useThree((st) => st.setDpr)
  const gl = useThree((st) => st.gl)
  const acc = useRef({ t: 0, n: 0, level: 0, skip: 6 })
  useEffect(() => {
    ;(gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = 0.5
  }, [gl])
  useFrame((_, dt) => {
    const a = acc.current
    if (a.skip > 0) return void a.skip-- // ignore shader-compile frames
    a.t += dt
    a.n++
    if (a.t < 1.2) return // judge on ~1.2 s windows, whatever the frame rate
    const avg = a.t / a.n
    a.t = 0
    a.n = 0
    if (avg > 1 / 35 && a.level === 0) {
      a.level = 1
      a.skip = 3
      setDpr(1)
    } else if (avg > 1 / 22 && a.level === 1) {
      a.level = 2
      onDegrade()
    }
  })
  return null
}

function Rig({ s, low }: { s: React.RefObject<CtaState>; low: boolean }) {
  const env = useStudioEnv(false)
  const envLight = useStudioEnv(true)
  const scene = useThree((st) => st.scene)
  const camera = useThree((st) => st.camera)
  const vp = useThree((st) => st.viewport)
  useEffect(() => {
    scene.environment = themeState.t > 0.5 ? envLight : env
    return () => {
      scene.environment = null
    }
  }, [scene, env, envLight])
  // theme: swap the studio reflection at the midpoint of the tween (no remount)
  useFrame(() => {
    const want = themeState.t > 0.5 ? envLight : env
    if (scene.environment !== want) scene.environment = want
  })

  const items = useMemo<SpecItem[]>(() => {
    const q = low ? 0.55 : 1
    return [
      { geo: surface(flower, Math.round(260 * q), Math.round(48 * q)), color: '#8af0c8', atten: '#1a8a62', spin: [0.05, 0.08, 0.11], bob: 0.09, phase: 0 },
      { geo: surface(core, Math.round(320 * q), Math.round(64 * q)), color: '#9cf6f0', atten: '#167a76', spin: [0.04, 0.06, -0.05], bob: 0.07, phase: 2.3 },
      { geo: surface(ribbon, Math.round(260 * q), Math.round(40 * q)), color: '#8fe8dc', atten: '#13646c', spin: [-0.06, 0.05, 0.09], bob: 0.1, phase: 4.1 },
    ]
  }, [low])
  useEffect(() => () => items.forEach((it) => it.geo.dispose()), [items])

  /* layout: fit the three sculptures into the band below the real content
     (measured each frame from s.cf), so they never sit behind the CTAs */
  const w = vp.width
  const h = vp.height
  const narrow = w / h < 0.9
  const places = useRef<Place[]>([])
  const layout = (cf: number) => {
    const yTop = h / 2 - cf * h - h * 0.05 // world y just under the buttons
    const band = Math.max(yTop + h / 2, h * 0.22) // height left below the content
    const kc = Math.min((band * 0.46) / 1.8, narrow ? w * 0.19 : h * 0.105) // core ≈ 1.8 k radius
    const ks = kc * (narrow ? 0.5 : 0.72)
    const yc = yTop - Math.max(band * 0.52, kc * 1.9)
    const sideX = narrow ? w * 0.34 : Math.min(w * 0.36, w / 2 - ks * 2)
    // on wide screens the side pieces may rise beside the text; on narrow ones they stay in the band
    const yl = narrow ? yTop - Math.max(band * 0.5, ks * 2.2) : yTop - band * 0.12
    const yr = narrow ? yTop - Math.max(band * 0.4, ks * 2.1) : yTop + band * 0.02
    places.current = [
      { x: -sideX, y: yl, z: -0.4, k: ks, from: [-w * 0.18, -h * 0.35] },
      { x: w * 0.01, y: yc, z: 0.5, k: kc, from: [0, -h * 0.5] },
      { x: sideX, y: yr, z: -0.6, k: ks * 0.94, from: [w * 0.18, -h * 0.35] },
    ]
  }
  if (!places.current.length) layout(s.current!.cf)
  useFrame(() => layout(s.current!.cf), -1)

  // camera breathes slightly with the pointer
  useFrame((_, dt) => {
    const S = s.current!
    const d = Math.min(dt, 0.05)
    camera.position.x += (S.px * 0.35 * S.inside - camera.position.x) * (1 - Math.exp(-d * 2))
    camera.position.y += (-S.py * 0.2 * S.inside - camera.position.y) * (1 - Math.exp(-d * 2))
    camera.lookAt(0, -0.6, 0)
  })

  /* hover: cheap bounding-sphere ray test, run when the pointer moves */
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const sph = useMemo(() => new THREE.Sphere(), [])
  const groups = useRef<THREE.Group>(null)
  useFrame(() => {
    const S = s.current!
    if (!S.inside) {
      S.hover = -1
      return
    }
    ray.setFromCamera(new THREE.Vector2(S.px, -S.py), camera)
    let hit = -1
    groups.current!.children.forEach((c, i) => {
      const k = c.scale.x
      sph.set(c.position, 1.35 * k)
      if (ray.ray.intersectsSphere(sph)) hit = i
    })
    S.hover = hit
  })

  return (
    <group ref={groups}>
      {items.map((it, i) => (
        <Sculpture key={i} it={it} i={i} s={s} places={places} />
      ))}
    </group>
  )
}

/* key/rim lights follow the theme mix; a theme switch also wakes an
   on-demand (degraded) canvas for the length of the tween */
function ThemeLights() {
  const amb = useRef<THREE.AmbientLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const gl = useThree((st) => st.gl)
  const invalidate = useThree((st) => st.invalidate)
  const rimDark = useMemo(() => new THREE.Color('#c6ff00'), [])
  const rimLight = useMemo(() => new THREE.Color('#7fae1a'), [])
  useEffect(
    () =>
      onTheme(() => {
        const until = performance.now() + 900
        const tick = () => {
          invalidate()
          if (performance.now() < until) requestAnimationFrame(tick)
        }
        tick()
      }),
    [invalidate],
  )
  useFrame(() => {
    const k = themeState.t
    if (amb.current) amb.current.intensity = 0.15 + 0.45 * k
    if (rim.current) {
      rim.current.color.copy(rimDark).lerp(rimLight, k)
      rim.current.intensity = 1.4 - 0.5 * k
    }
    gl.toneMappingExposure = 1.05 - 0.1 * k
  })
  return (
    <>
      <ambientLight ref={amb} intensity={0.15} />
      <directionalLight position={[-4, 5, 6]} intensity={1.2} color="#bff6ff" />
      <directionalLight ref={rim} position={[5, -1, -3]} intensity={1.4} color="#c6ff00" />
    </>
  )
}

export default function SculptureScene({
  s,
  frameloop,
  low,
  onDegrade,
}: {
  s: React.RefObject<CtaState>
  frameloop: 'always' | 'demand' | 'never'
  low: boolean
  onDegrade: () => void
}) {
  return (
    <Canvas
      className="fc__canvas"
      frameloop={frameloop}
      dpr={low ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [0, 0, 10], fov: 32, near: 0.1, far: 40 }}
      style={{ pointerEvents: 'none' }}
    >
      <ThemeLights />
      {frameloop === 'always' && <PerfGuard onDegrade={onDegrade} />}
      <Backdrop />
      <Rig s={s} low={low} />
    </Canvas>
  )
}
