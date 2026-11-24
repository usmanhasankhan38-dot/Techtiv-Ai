import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { BAND_EXTENT, bevelRing, filamentCurve, mobiusGeometry } from './geometry'
import { buildStudio, imperfectionMap, metal } from './materials'
import { globeAnchors, pointer, sceneMotion, sceneState } from '../../lib/store'

export type CoreLayout = 'desktop' | 'compact'
type Props = { layout: CoreLayout; reducedMotion: boolean; active: boolean; onLost: () => void }

type Box = { cx: number; cy: number; d: number }
function readAnchor(el: HTMLElement | null, out: Box): Box | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0) return null
  out.cx = r.left + r.width / 2
  out.cy = r.top + r.height / 2
  out.d = Math.min(r.width, r.height)
  return out
}
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))

/* ---------- inlaid filament: a slow light pulse travelling the single surface ---------- */
const filamentVert = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const filamentFrag = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uLime;
  uniform vec3 uCyan;
  varying float vU;
  void main() {
    if (vU > uReveal) discard;
    // brand gradient along the length (cyan → lime → cyan), two soft pulses
    vec3 col = mix(uCyan, uLime, 0.5 + 0.5 * sin(vU * 6.2831853 * 2.0));
    float d = fract(vU * 2.0 - uTime * 0.045);
    float pulse = exp(-d * 22.0) + exp(-(1.0 - d) * 60.0);
    float k = 0.32 + 1.35 * pulse;
    gl_FragColor = vec4(col * k, 1.0);
  }
`

function Core({ layout, reducedMotion, lowPower }: { layout: CoreLayout; reducedMotion: boolean; lowPower: boolean }) {
  const { camera, gl, size, viewport, scene } = useThree()
  const root = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const g1 = useRef<THREE.Mesh>(null!)
  const g2 = useRef<THREE.Mesh>(null!)
  const key = useRef<THREE.DirectionalLight>(null!)
  const inner = useRef<THREE.PointLight>(null!)

  const compact = layout === 'compact'
  const geo = useMemo(
    () => ({
      band: mobiusGeometry(compact || lowPower ? 220 : 360, compact || lowPower ? 40 : 56),
      fil: new THREE.TubeGeometry(filamentCurve(), compact ? 600 : 900, 0.0085, 6, true),
      ring1: bevelRing(0.5, 0.024, 0.052, compact ? 120 : 180),
      ring2: bevelRing(0.39, 0.016, 0.032, compact ? 100 : 160),
    }),
    [compact, lowPower],
  )
  const rough = useMemo(() => imperfectionMap(lowPower ? 256 : 512), [lowPower])
  const mats = useMemo(() => {
    const body = metal('emeraldMetal', rough, lowPower)
    rough.repeat.set(3, 1)
    const chrome = metal('chrome', null, lowPower)
    const ti = metal('titanium', rough, lowPower)
    const fil = new THREE.ShaderMaterial({
      vertexShader: filamentVert,
      fragmentShader: filamentFrag,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uLime: { value: new THREE.Color('#c6ff00') },
        uCyan: { value: new THREE.Color('#3de8ff') },
      },
    })
    return { body, chrome, ti, fil }
  }, [rough, lowPower])

  // studio environment (shared by every metal in this scene)
  useEffect(() => {
    const rt = buildStudio(gl)
    scene.environment = rt.texture
    return () => {
      scene.environment = null
      rt.dispose()
    }
  }, [gl, scene])

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(mats).forEach((m) => m.dispose())
      rough.dispose()
    },
    [geo, mats, rough],
  )

  const tmp = useMemo(
    () => ({
      ra: { cx: 0, cy: 0, d: 0 },
      rb: { cx: 0, cy: 0, d: 0 },
      ray: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      sphere: new THREE.Sphere(),
      center: new THREE.Vector3(),
      px: 0,
      py: 0,
      spin: 0,
      env: 0,
      hover: 0,
    }),
    [],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const t = state.clock.elapsedTime
    const live = !reducedMotion

    /* ---- framing: follow the section anchors (hero → technology) ---- */
    const worldPerPx = viewport.height / size.height
    const a = readAnchor(globeAnchors.hero, tmp.ra)
    const b = readAnchor(globeAnchors.tech, tmp.rb)
    const h = THREE.MathUtils.smootherstep(sceneMotion.handoff, 0, 1)
    let cx: number, cy: number, dPx: number
    if (a && b) {
      cx = THREE.MathUtils.lerp(a.cx, b.cx, h)
      cy = THREE.MathUtils.lerp(a.cy, b.cy, h)
      dPx = THREE.MathUtils.lerp(a.d, b.d, h)
    } else {
      const only = a || b || { cx: size.width / 2, cy: size.height * 0.6, d: size.height * 0.5 }
      cx = only.cx
      cy = only.cy
      dPx = only.d
    }
    /* ---- climax: the band rises into a monumental arch over the horizon ---- */
    const z = sceneMotion.zoom
    const bell = 0.5 - 0.5 * Math.cos(z * Math.PI * 2)
    if (bell > 0.0001) {
      const peakD = compact ? size.width * 1.75 : Math.max(size.width * 1.32, size.height * 1.9)
      cx = THREE.MathUtils.lerp(cx, size.width / 2, bell)
      cy = THREE.MathUtils.lerp(cy, size.height * (compact ? 0.98 : 1.08), bell)
      dPx = THREE.MathUtils.lerp(dPx, peakD, bell)
    }
    const reveal = ease(sceneMotion.reveal)
    const R = (dPx / 2) * worldPerPx
    const k = (R / BAND_EXTENT) * (0.84 + 0.16 * reveal)
    root.current.scale.setScalar(k)
    root.current.position.set((cx / size.width - 0.5) * viewport.width, (0.5 - cy / size.height) * viewport.height - (1 - reveal) * R * 0.18, 0)

    /* ---- pointer (damped) ---- */
    const nx = live && pointer.inside ? (pointer.x / size.width) * 2 - 1 : 0
    const ny = live && pointer.inside ? (pointer.y / size.height) * 2 - 1 : 0
    tmp.px = damp(tmp.px, nx, 2.4, dt)
    tmp.py = damp(tmp.py, ny, 2.4, dt)

    /* ---- orientation: 3/4 view at rest, faces the camera at the climax ---- */
    tilt.current.rotation.x = THREE.MathUtils.lerp(-0.52, -0.06, bell) + tmp.py * 0.16
    tilt.current.rotation.y = THREE.MathUtils.lerp(0.55, 0, bell) + tmp.px * 0.22 + (1 - reveal) * 0.9
    tilt.current.rotation.z = THREE.MathUtils.lerp(-0.3, 0, bell)
    if (live) tmp.spin += dt * (0.1 + bell * 0.05)
    spin.current.rotation.z = tmp.spin
    if (live) {
      g1.current.rotation.x = t * 0.21
      g1.current.rotation.y = Math.sin(t * 0.17) * 0.6
      g2.current.rotation.y = t * -0.29
      g2.current.rotation.x = Math.cos(t * 0.13) * 0.7
    } else {
      g1.current.rotation.set(0.9, 0.3, 0)
      g2.current.rotation.set(-0.4, 1.1, 0)
    }

    /* ---- light: environment drifts slowly; key light and reflections lean toward the cursor ---- */
    tmp.env = live ? t * 0.035 : 0
    scene.environmentRotation.set(tmp.py * 0.12, tmp.env + tmp.px * 0.32, 0)
    key.current.position.set(4 + tmp.px * 5, 6 - tmp.py * 4, 6)
    const envK = 0.25 + 0.75 * reveal + bell * 0.15 + tmp.hover * 0.12
    mats.body.envMapIntensity = 1.25 * envK
    mats.chrome.envMapIntensity = 1.35 * envK
    mats.ti.envMapIntensity = 1.1 * envK
    inner.current.intensity = (1.2 + 0.5 * Math.sin(t * 0.8)) * reveal * (live ? 1 : 0.8)
    mats.fil.uniforms.uTime.value = live ? t : 6
    mats.fil.uniforms.uReveal.value = Math.min(1, sceneMotion.reveal * 1.15)

    /* ---- hover: cursor ring + a slight lift of the reflections ---- */
    let on = false
    if (live && pointer.inside) {
      const rect = gl.domElement.getBoundingClientRect()
      tmp.ndc.set(((pointer.x - rect.left) / rect.width) * 2 - 1, -((pointer.y - rect.top) / rect.height) * 2 + 1)
      tmp.ray.setFromCamera(tmp.ndc, camera)
      root.current.getWorldPosition(tmp.center)
      tmp.sphere.set(tmp.center, R * 0.9)
      on = tmp.ray.ray.intersectsSphere(tmp.sphere) && bell < 0.3
    }
    tmp.hover = damp(tmp.hover, on ? 1 : 0, 4, dt)
    sceneState.pointerOnGlobe = on
  })

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight ref={key} intensity={1.1} color="#f2fff9" position={[4, 6, 6]} />
      <directionalLight intensity={0.9} color="#3de8ff" position={[-6, 1.5, -5]} />
      <group ref={root}>
        <group ref={tilt}>
          <group ref={spin}>
            <mesh geometry={geo.band} material={mats.body} />
            <mesh geometry={geo.fil} material={mats.fil} />
          </group>
          <mesh ref={g1} geometry={geo.ring1} material={mats.chrome} />
          <mesh ref={g2} geometry={geo.ring2} material={mats.ti} />
          <pointLight ref={inner} color="#a6ffd6" distance={2.2} decay={2} intensity={0} />
        </group>
      </group>
    </>
  )
}

/** In demand mode (reduced motion) re-render when scrolling or resizing moves the anchors. */
function DemandOnScroll() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const on = () => invalidate()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [invalidate])
  return null
}

/** Time-based performance guard: slow 1.2s windows → lower DPR, then the low-power path. */
function PerfGuard({ onSlow, onVerySlow }: { onSlow: () => void; onVerySlow: () => void }) {
  const a = useRef({ t: 0, n: 0, stage: 0, warm: 0 })
  useFrame((_, delta) => {
    const s = a.current
    if (s.stage >= 2) return
    s.warm += delta
    if (s.warm < 1.5) return // ignore shader-compile frames
    s.t += delta
    s.n++
    if (s.t < 1.2) return
    const avg = s.t / s.n
    s.t = 0
    s.n = 0
    if (s.stage === 0 && avg > 1 / 40) {
      s.stage = 1
      onSlow()
    } else if (s.stage === 1 && avg > 1 / 28) {
      s.stage = 2
      onVerySlow()
    }
  })
  return null
}

export default function CoreScene({ layout, reducedMotion, active, onLost }: Props) {
  const [dpr, setDpr] = useState(layout === 'compact' ? 1.5 : 1.75)
  const [lowPower, setLowPower] = useState(false)
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, dpr]}
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onLost()
        })
      }}
    >
      {reducedMotion && <DemandOnScroll />}
      <PerfGuard onSlow={() => setDpr(1)} onVerySlow={() => setLowPower(true)} />
      <Core layout={layout} reducedMotion={reducedMotion} lowPower={lowPower} />
    </Canvas>
  )
}
