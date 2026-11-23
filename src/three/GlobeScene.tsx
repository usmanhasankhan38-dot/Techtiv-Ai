import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildLandCloud } from './landPoints'
import {
  atmoFragment, atmoVertex, coreFragment, coreVertex, fieldFragment, fieldVertex,
  landFragment, landVertex, orbitPointFragment, orbitPointVertex, ringFragment, ringVertex,
} from './shaders'
import { globeAnchors, pointer, sceneMotion, sceneState } from '../lib/store'

type AnchorBox = { cx: number; cy: number; d: number }
function readAnchor(el: HTMLElement | null, out: AnchorBox): AnchorBox | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0) return null
  out.cx = r.left + r.width / 2
  out.cy = r.top + r.height / 2
  out.d = Math.min(r.width, r.height)
  return out
}

/* Brand colours (live site tokens) */
const LIME = new THREE.Color('#c6ff00')
const CYAN = new THREE.Color('#3de8ff')
const MINT = new THREE.Color('#e8fff5')
const BASE = new THREE.Color('#06140b') // between --bg-primary and --surface-card, lifted for form

export type GlobeLayout = 'desktop' | 'compact'

type Props = {
  layout: GlobeLayout
  reducedMotion: boolean
  active: boolean
}

const ORBITS = [
  { r: 1.38, incline: 0.32, flatten: 1.24, yaw: 0.0, speed: 0.06, phase: 0.1, tube: 0.0034 },
  { r: 1.6, incline: -0.42, flatten: 1.33, yaw: 0.35, speed: 0.042, phase: 0.55, tube: 0.003 },
  { r: 1.86, incline: 0.12, flatten: 1.42, yaw: -0.25, speed: 0.03, phase: 0.8, tube: 0.0028 },
]

function OrbitRing({ cfg, index, reduced }: { cfg: (typeof ORBITS)[number]; index: number; reduced: boolean }) {
  const outer = useRef<THREE.Group>(null!)
  const ringMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: cfg.speed },
          uPhase: { value: cfg.phase },
          uDraw: { value: 0 },
          uOpacity: { value: 0.9 },
          uCyan: { value: CYAN },
          uLime: { value: LIME },
        },
      }),
    [cfg],
  )
  const ptsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: orbitPointVertex,
        fragmentShader: orbitPointFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: cfg.speed * 1.55 },
          uRadiusOrbit: { value: cfg.r },
          uPixelRatio: { value: 1 },
          uDraw: { value: 0 },
          uColor: { value: index % 2 ? CYAN : LIME },
        },
      }),
    [cfg, index],
  )
  const ptsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = 3
    const phase = new Float32Array(n)
    const size = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      phase[i] = (i / n + index * 0.17) % 1
      size[i] = 9 + ((i + index) % 3) * 3
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3)
    return g
  }, [index])

  useFrame((state) => {
    const t = reduced ? 8 : state.clock.elapsedTime
    const draw = THREE.MathUtils.clamp(sceneMotion.orbits * 1.7 - index * 0.35, 0, 1)
    ringMat.uniforms.uTime.value = t
    ringMat.uniforms.uDraw.value = draw
    ptsMat.uniforms.uTime.value = t
    ptsMat.uniforms.uDraw.value = draw
    ptsMat.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
    if (!reduced) {
      // slow, independent precession for each orbit
      outer.current.rotation.y = cfg.yaw + Math.sin(t * 0.07 + index * 2.1) * 0.12
    }
  })

  return (
    <group ref={outer} rotation={[0, cfg.yaw, cfg.incline]}>
      <group rotation={[cfg.flatten, 0, 0]}>
        <mesh material={ringMat} renderOrder={3}>
          <torusGeometry args={[cfg.r, cfg.tube, 6, 320]} />
        </mesh>
        <points geometry={ptsGeo} material={ptsMat} renderOrder={4} />
      </group>
    </group>
  )
}

function Globe({ layout, reducedMotion, lowPower }: { layout: GlobeLayout; reducedMotion: boolean; lowPower: boolean }) {
  const root = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const field = useRef<THREE.Mesh>(null!)
  const { camera, gl, size, viewport } = useThree()

  const samples = lowPower || layout === 'compact' ? 26000 : 46000
  const cloud = useMemo(() => buildLandCloud(samples, 1.004), [samples])

  const landGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(cloud.rand, 1))
    return g
  }, [cloud])

  const mats = useMemo(() => {
    const land = new THREE.ShaderMaterial({
      vertexShader: landVertex,
      fragmentShader: landFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uSize: { value: 2 },
        uPixelRatio: { value: 1 },
        uPointer: { value: new THREE.Vector3(0, 0, 1) },
        uDrag: { value: new THREE.Vector3() },
        uStrength: { value: 0 },
        uRadius: { value: 1 },
        uLand: { value: MINT },
        uHot: { value: LIME },
        uCyan: { value: CYAN },
      },
    })
    const core = new THREE.ShaderMaterial({
      vertexShader: coreVertex,
      fragmentShader: coreFragment,
      uniforms: { uBase: { value: BASE }, uCyan: { value: CYAN }, uLime: { value: LIME }, uReveal: { value: 0 } },
    })
    const atmo = new THREE.ShaderMaterial({
      vertexShader: atmoVertex,
      fragmentShader: atmoFragment,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uCyan: { value: CYAN }, uLime: { value: LIME }, uReveal: { value: 0 } },
    })
    const fieldMat = new THREE.ShaderMaterial({
      vertexShader: fieldVertex,
      fragmentShader: fieldFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPointerUv: { value: new THREE.Vector2(-5, -5) },
        uVel: { value: new THREE.Vector2() },
        uStrength: { value: 0 },
        uReveal: { value: 0 },
        uCyan: { value: CYAN },
        uLime: { value: LIME },
      },
    })
    return { land, core, atmo, fieldMat }
  }, [])

  // scratch objects (never allocate inside the frame loop)
  const tmp = useMemo(
    () => ({
      ray: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      center: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      local: new THREE.Vector3(),
      prevLocal: new THREE.Vector3(0, 0, 1),
      drag: new THREE.Vector3(),
      inv: new THREE.Quaternion(),
      sphere: new THREE.Sphere(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      planeHit: new THREE.Vector3(),
      strength: 0,
      fieldStrength: 0,
      vel: new THREE.Vector2(),
      parX: 0,
      parY: 0,
      ra: { cx: 0, cy: 0, d: 0 },
      rb: { cx: 0, cy: 0, d: 0 },
    }),
    [],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const t = state.clock.elapsedTime
    const { land, core, atmo, fieldMat } = mats

    // ---- layout: follow the section anchors (screen px → world units) ----
    const worldPerPx = viewport.height / size.height
    const a = readAnchor(globeAnchors.hero, tmp.ra)
    const b = readAnchor(globeAnchors.tech, tmp.rb)
    const h = THREE.MathUtils.smootherstep(sceneMotion.handoff, 0, 1)
    let cx: number, cy: number, diameterPx: number
    if (a && b) {
      cx = THREE.MathUtils.lerp(a.cx, b.cx, h)
      cy = THREE.MathUtils.lerp(a.cy, b.cy, h)
      diameterPx = THREE.MathUtils.lerp(a.d, b.d, h)
    } else {
      const only = a || b || { cx: size.width / 2, cy: size.height * 0.75, d: size.height * 0.45 }
      cx = only.cx
      cy = only.cy
      diameterPx = only.d
    }
    // ---- cinematic push-in / pull-out across the hero → technology journey ----
    // bell curve: 0 at both ends (hero frame and technology frame untouched), 1 at the midpoint
    const z = sceneMotion.zoom
    const bell = 0.5 - 0.5 * Math.cos(z * Math.PI * 2)
    if (bell > 0.0001) {
      // close-up framed as a planet horizon: the lit limb arcs across the upper screen
      const peakD = Math.max(size.width, size.height) * (size.width < 768 ? 1.1 : 1.05)
      cx = THREE.MathUtils.lerp(cx, size.width / 2, bell)
      cy = THREE.MathUtils.lerp(cy, size.height * 0.92, bell)
      diameterPx = THREE.MathUtils.lerp(diameterPx, peakD, bell)
    }
    const R = (diameterPx / 2) * worldPerPx
    root.current.scale.setScalar(R)
    root.current.position.set((cx / size.width - 0.5) * viewport.width, (0.5 - cy / size.height) * viewport.height, 0)

    // ---- continuous motion ----
    if (!reducedMotion) {
      spin.current.rotation.y += dt * 0.085
      // subtle parallax toward the pointer
      const nx = pointer.inside ? (pointer.x / window.innerWidth) * 2 - 1 : 0
      const ny = pointer.inside ? (pointer.y / window.innerHeight) * 2 - 1 : 0
      tmp.parX += (ny * 0.06 - tmp.parX) * 0.04
      tmp.parY += (nx * 0.08 - tmp.parY) * 0.04
      tilt.current.rotation.x = tmp.parX
      tilt.current.rotation.y = tmp.parY
    }

    // ---- pointer → globe (analytic ray / sphere test) ----
    let onGlobe = false
    if (!reducedMotion && pointer.inside) {
      const rect = gl.domElement.getBoundingClientRect()
      tmp.ndc.set(((pointer.x - rect.left) / rect.width) * 2 - 1, -((pointer.y - rect.top) / rect.height) * 2 + 1)
      if (Math.abs(tmp.ndc.x) <= 1 && Math.abs(tmp.ndc.y) <= 1) {
        tmp.ray.setFromCamera(tmp.ndc, camera)
        root.current.getWorldPosition(tmp.center)
        tmp.sphere.set(tmp.center, R * 1.02)
        if (tmp.ray.ray.intersectSphere(tmp.sphere, tmp.hit)) {
          onGlobe = true
          spin.current.getWorldQuaternion(tmp.inv).invert()
          tmp.local.copy(tmp.hit).sub(tmp.center).applyQuaternion(tmp.inv).normalize()
          tmp.drag.copy(tmp.local).sub(tmp.prevLocal)
          tmp.prevLocal.copy(tmp.local)
          const u = land.uniforms
          ;(u.uPointer.value as THREE.Vector3).lerp(tmp.local, 0.35).normalize()
          const dLen = Math.min(tmp.drag.length() / 0.04, 1)
          if (tmp.drag.lengthSq() > 1e-8) tmp.drag.normalize().multiplyScalar(dLen)
          ;(u.uDrag.value as THREE.Vector3).lerp(tmp.drag, 0.2)
        }
        // pointer on the field plane (z through the globe centre)
        tmp.plane.constant = -tmp.center.z
        if (tmp.ray.ray.intersectPlane(tmp.plane, tmp.planeHit)) {
          const half = R * 2.1
          const uvx = (tmp.planeHit.x - tmp.center.x + half) / (half * 2)
          const uvy = (tmp.planeHit.y - tmp.center.y + half) / (half * 2)
          ;(fieldMat.uniforms.uPointerUv.value as THREE.Vector2).set(uvx, uvy)
        }
      }
    }
    sceneState.pointerOnGlobe = onGlobe
    sceneState.liquid = tmp.strength

    // velocity-driven strength with fast attack and slow, damped release
    // gentle presence while hovering, stronger with pointer velocity
    let target = onGlobe ? Math.min(0.16 + pointer.speed * 1.2, 0.72) : 0
    if (sceneState.forceLiquid != null) target = sceneState.forceLiquid
    tmp.strength += (target - tmp.strength) * (target > tmp.strength ? 0.16 : 0.035)
    const fieldTarget = pointer.inside && !reducedMotion ? Math.min(pointer.speed * 0.7, 1) : 0
    tmp.fieldStrength += (fieldTarget - tmp.fieldStrength) * (fieldTarget > tmp.fieldStrength ? 0.12 : 0.03)
    tmp.vel.x += (pointer.vx * 0.35 - tmp.vel.x) * 0.1
    tmp.vel.y += (-pointer.vy * 0.35 - tmp.vel.y) * 0.1
    if (!onGlobe) (land.uniforms.uDrag.value as THREE.Vector3).multiplyScalar(0.95)

    // ---- uniforms ----
    const reveal = reducedMotion ? 1 : sceneMotion.reveal
    const pr = gl.getPixelRatio()
    const dotPx = 0.0158 * (diameterPx / 2) * 0.5
    land.uniforms.uTime.value = reducedMotion ? 0 : t
    land.uniforms.uReveal.value = reveal
    land.uniforms.uPixelRatio.value = pr
    land.uniforms.uSize.value = THREE.MathUtils.clamp(dotPx, 1.1, 4.2) * 1.25
    land.uniforms.uStrength.value = tmp.strength
    core.uniforms.uReveal.value = reveal
    atmo.uniforms.uReveal.value = reveal
    fieldMat.uniforms.uTime.value = reducedMotion ? 0 : t
    fieldMat.uniforms.uReveal.value = reveal
    fieldMat.uniforms.uStrength.value = tmp.fieldStrength
    ;(fieldMat.uniforms.uVel.value as THREE.Vector2).copy(tmp.vel)
    if (field.current) field.current.visible = !lowPower
  })

  return (
    <group ref={root}>
      {/* atmospheric field: only around the globe, not a full-screen pass */}
      <mesh ref={field} position={[0, 0, -1.6]} material={mats.fieldMat} renderOrder={-1}>
        <planeGeometry args={[4.2, 4.2, 1, 1]} />
      </mesh>
      <group ref={tilt}>
        <group rotation={[0, 0, 0.41]}>
          <group ref={spin} rotation={[0, -0.9, 0]}>
            <mesh material={mats.core} renderOrder={0}>
              <sphereGeometry args={[0.995, 96, 64]} />
            </mesh>
            <points geometry={landGeo} material={mats.land} renderOrder={2} />
          </group>
        </group>
        <mesh material={mats.atmo} renderOrder={1}>
          <sphereGeometry args={[1.1, 64, 48]} />
        </mesh>
        {ORBITS.map((o, i) => (
          <OrbitRing key={i} cfg={o} index={i} reduced={reducedMotion} />
        ))}
      </group>
    </group>
  )
}

/** Lightweight performance guard: two consecutive slow 2s windows → low-power mode. */
function FrameRateGuard({ onDecline }: { onDecline: () => void }) {
  const acc = useRef({ frames: 0, time: 0, strikes: 0, done: false })
  useFrame((_, delta) => {
    const a = acc.current
    if (a.done) return
    a.frames++
    a.time += delta
    if (a.time >= 2) {
      const fps = a.frames / a.time
      a.strikes = fps < 38 ? a.strikes + 1 : 0
      a.frames = 0
      a.time = 0
      if (a.strikes >= 2) {
        a.done = true
        onDecline()
      }
    }
  })
  return null
}

export default function GlobeScene({ layout, reducedMotion, active }: Props) {
  const [dpr, setDpr] = useState(1.75)
  const [lowPower, setLowPower] = useState(false)
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, dpr]}
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      camera={{ fov: 35, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      events={undefined}
      style={{ pointerEvents: 'none' }}
    >
      <FrameRateGuard
        onDecline={() => {
          setDpr(1)
          setLowPower(true)
        }}
      />
      <Globe layout={layout} reducedMotion={reducedMotion} lowPower={lowPower} />
    </Canvas>
  )
}
