import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildLandCloud } from './landPoints'
import {
  atmoFragment, atmoVertex, coreFragment, coreVertex, fieldFragment, fieldVertex,
  landFragment, landVertex, orbitPointFragment, orbitPointVertex, ringFragment, ringVertex,
} from './shaders'
import { globeAnchors, pointer, sceneMotion, sceneState, techGlobe } from '../lib/store'
import { hotspotGeometry, hotspotMaterial } from './techHotspots'
import { TECH } from '../components/tech/techData'
import { themeState } from '../lib/theme'
import ThemeInvalidate from './ThemeInvalidate'

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
/* Light theme: the sphere stays a dark object (the dotted land needs it), but
   lifts to deep forest; the additive glows are re-toned to teal/olive and the
   orbit rings switch to normal blending so they read as ink on a light page. */
const L_LIME = new THREE.Color('#4f7d00')
const L_CYAN = new THREE.Color('#007f97')
const L_BASE = new THREE.Color('#0c2a1a')
const L_ATMO_C = new THREE.Color('#0a6f7f')
const L_ATMO_L = new THREE.Color('#3f6d00')
type U = { value: THREE.Color }
/** lerp a colour uniform between its dark and light value by the theme mix */
function tone(u: U, dark: THREE.Color, light: THREE.Color, k: number) {
  u.value.copy(dark).lerp(light, k)
}

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
  const lastK = useRef(-1)
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
          uCyan: { value: CYAN.clone() },
          uLime: { value: LIME.clone() },
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
          uColor: { value: (index % 2 ? CYAN : LIME).clone() },
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
    const k = themeState.t
    if (k !== lastK.current) {
      lastK.current = k
      tone(ringMat.uniforms.uCyan, CYAN, L_CYAN, k)
      tone(ringMat.uniforms.uLime, LIME, L_LIME, k)
      tone(ptsMat.uniforms.uColor, index % 2 ? CYAN : LIME, index % 2 ? L_CYAN : L_LIME, k)
      const blend = k > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending
      ringMat.blending = blend
      ptsMat.blending = blend
      ringMat.uniforms.uOpacity.value = 0.9 - 0.25 * k
    }
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
  const hot = useRef<THREE.Points>(null!)
  const { camera, gl, size, viewport, invalidate } = useThree()

  /* V3 Technology explorer: one hotspot per technology, on the spinning globe */
  const hotGeo = useMemo(() => hotspotGeometry(TECH.length), [])
  const hotMat = useMemo(() => hotspotMaterial(TECH.length), [])
  useEffect(() => {
    techGlobe.count = TECH.length
    techGlobe.invalidate = invalidate
    return () => {
      techGlobe.invalidate = null
      hotGeo.dispose()
      hotMat.dispose()
    }
  }, [invalidate, hotGeo, hotMat])

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
        uCyan: { value: CYAN.clone() },
      },
    })
    const core = new THREE.ShaderMaterial({
      vertexShader: coreVertex,
      fragmentShader: coreFragment,
      uniforms: { uBase: { value: BASE.clone() }, uCyan: { value: CYAN.clone() }, uLime: { value: LIME.clone() }, uReveal: { value: 0 } },
    })
    const atmo = new THREE.ShaderMaterial({
      vertexShader: atmoVertex,
      fragmentShader: atmoFragment,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uCyan: { value: CYAN.clone() }, uLime: { value: LIME.clone() }, uReveal: { value: 0 } },
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
        uCyan: { value: CYAN.clone() },
        uLime: { value: LIME.clone() },
      },
    })
    return { land, core, atmo, fieldMat }
  }, [])

  // scratch objects (never allocate inside the frame loop)
  const tmp = useMemo(
    () => ({
      ray: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      themeK: -1,
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
      // orientation (quaternion): auto spin + drag + inertia share one angular velocity
      pq: new THREE.Quaternion(),
      pqi: new THREE.Quaternion(),
      wq: new THREE.Quaternion(),
      rq: new THREE.Quaternion(),
      omega: new THREE.Vector3(), // manual / inertial angular velocity, world, rad/s
      axis: new THREE.Vector3(),
      auto: reducedMotion ? 0 : 0.085, // current auto speed (rad/s), eased toward its target
      focusQ: new THREE.Quaternion(),
      focusing: false,
      v1: new THREE.Vector3(),
      v2: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      hits: [] as THREE.Intersection[],
      lastPick: 0,
      hoverPrev: -1,
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

    // ---- orientation: quaternion, so auto spin, drag and inertia never fight ----
    // (GSAP never touches rotation: it only feeds intro / handoff values)
    const tg = techGlobe
    const interactive = !!b && h > 0.9
    tg.enabled = interactive
    const sp = spin.current
    ;(sp.parent as THREE.Object3D).getWorldQuaternion(tmp.pq)
    tmp.pqi.copy(tmp.pq).invert()
    tmp.wq.copy(tmp.pq).multiply(sp.quaternion) // spin's world orientation
    // drag: the surface follows the pointer (arc length = px / globe radius)
    const rpx = Math.max(40, diameterPx / 2)
    if (interactive && tg.dragging) {
      const ax = tg.dragDY / rpx
      const ay = tg.dragDX / rpx
      tg.dragDX = 0
      tg.dragDY = 0
      tmp.v1.set(ax, ay, 0) // rotation vector: about screen X (vertical drag) and Y (horizontal)
      const ang = tmp.v1.length()
      if (ang > 1e-6) {
        tmp.rq.setFromAxisAngle(tmp.axis.copy(tmp.v1).normalize(), ang)
        tmp.wq.premultiply(tmp.rq)
      }
      // remember the release velocity for inertia (smoothed)
      tmp.omega.lerp(tmp.v1.multiplyScalar(1 / Math.max(dt, 1 / 120)), 0.35)
      tmp.focusing = false
    } else if (tmp.omega.lengthSq() > 1e-8) {
      // natural inertia after release, damped
      const ang = tmp.omega.length() * dt
      tmp.rq.setFromAxisAngle(tmp.axis.copy(tmp.omega).normalize(), ang)
      tmp.wq.premultiply(tmp.rq)
      tmp.omega.multiplyScalar(Math.exp(-2.6 * dt))
      if (tmp.omega.lengthSq() < 1e-6) tmp.omega.set(0, 0, 0)
    }
    // auto rotation about the globe's own (tilted) axis — the hero's original motion
    const autoTarget = reducedMotion
      ? 0
      : !interactive
        ? 0.085
        : tg.dragging || tg.active >= 0 || tg.hover >= 0
          ? 0
          : tg.overGlobe
            ? 0.028
            : 0.085
    tmp.auto += (autoTarget - tmp.auto) * (1 - Math.exp(-(autoTarget > tmp.auto ? 0.9 : 3.2) * dt))
    if (tmp.auto > 1e-4) {
      tmp.axis.set(0, 1, 0).applyQuaternion(tmp.wq)
      tmp.rq.setFromAxisAngle(tmp.axis, tmp.auto * dt)
      tmp.wq.premultiply(tmp.rq)
    }
    // keyboard / index request: turn a hotspot to face the viewer
    if (interactive && tg.focusReq >= 0) {
      const pos = hotGeo.getAttribute('position') as THREE.BufferAttribute
      tmp.v1.fromBufferAttribute(pos, tg.focusReq).normalize().applyQuaternion(tmp.wq)
      root.current.getWorldPosition(tmp.center)
      tmp.v2.copy(camera.position).sub(tmp.center).normalize() // toward the viewer
      tmp.rq.setFromUnitVectors(tmp.v1, tmp.v2)
      tmp.focusQ.copy(tmp.wq).premultiply(tmp.rq)
      tmp.focusing = true
      tmp.omega.set(0, 0, 0)
      tg.focusReq = -1
    }
    if (tmp.focusing) {
      if (reducedMotion) tmp.wq.copy(tmp.focusQ)
      else tmp.wq.slerp(tmp.focusQ, 1 - Math.exp(-5 * dt))
      if (tmp.wq.angleTo(tmp.focusQ) < 0.002) tmp.focusing = false
      else invalidate()
    }
    sp.quaternion.copy(tmp.pqi).multiply(tmp.wq).normalize()

    if (!reducedMotion) {
      // subtle parallax toward the pointer (hero); stilled while exploring Technology
      const quiet = interactive ? 0 : 1
      const nx = pointer.inside ? (pointer.x / window.innerWidth) * 2 - 1 : 0
      const ny = pointer.inside ? (pointer.y / window.innerHeight) * 2 - 1 : 0
      tmp.parX += (ny * 0.06 * quiet - tmp.parX) * 0.04
      tmp.parY += (nx * 0.08 * quiet - tmp.parY) * 0.04
      tilt.current.rotation.x = tmp.parX
      tilt.current.rotation.y = tmp.parY
    }
    root.current.updateMatrixWorld(true)

    // ---- hotspots: raycast pick (front face only), screen anchor for the popup ----
    const hm = hotMat.uniforms
    hm.uIntro.value = tg.intro * THREE.MathUtils.smoothstep(h, 0.55, 1)
    hm.uTime.value = reducedMotion ? 0.35 : t
    hm.uPx.value = gl.getPixelRatio()
    hm.uSize.value = THREE.MathUtils.clamp(diameterPx * 0.05, 20, 30)
    const pick = (px: number, py: number) => {
      const rect = gl.domElement.getBoundingClientRect()
      tmp.ndc.set(((px - rect.left) / rect.width) * 2 - 1, -((py - rect.top) / rect.height) * 2 + 1)
      tmp.ray.setFromCamera(tmp.ndc, camera)
      const worldPerPx = viewport.height / size.height
      tmp.ray.params.Points = { threshold: worldPerPx * (tg.mouse ? 16 : 26) }
      tmp.hits.length = 0
      tmp.ray.intersectObject(hot.current, false, tmp.hits)
      root.current.getWorldPosition(tmp.center)
      tmp.cam.copy(camera.position)
      let best = -1
      let bestD = Infinity
      for (const it of tmp.hits) {
        // a hotspot behind the globe can never be picked through the visible surface
        tmp.v1.copy(it.point).sub(tmp.center).normalize()
        tmp.v2.copy(tmp.cam).sub(it.point).normalize()
        if (tmp.v1.dot(tmp.v2) < 0.3) continue
        const dRay = it.distanceToRay ?? 0
        if (dRay < bestD) {
          bestD = dRay
          best = it.index ?? -1
        }
      }
      return best
    }
    if (interactive && hm.uIntro.value > 0.5) {
      // mouse hover (not while dragging)
      tg.hover = tg.mouse && pointer.inside && tg.overGlobe && !tg.dragging ? pick(pointer.x, pointer.y) : -1
      // tap / click requests
      if (tg.pick.id !== tmp.lastPick) {
        tmp.lastPick = tg.pick.id
        tg.pickAns = { id: tg.pick.id, idx: pick(tg.pick.x, tg.pick.y) }
      }
    } else {
      tg.hover = -1
    }
    if (tg.hover !== tmp.hoverPrev) {
      tmp.hoverPrev = tg.hover
      invalidate()
    }
    hm.uHover.value = tg.hover
    hm.uActive.value = tg.active
    if (tg.active >= 0) {
      const pos = hotGeo.getAttribute('position') as THREE.BufferAttribute
      tmp.v1.fromBufferAttribute(pos, tg.active)
      hot.current.localToWorld(tmp.v1)
      root.current.getWorldPosition(tmp.center)
      tmp.v2.copy(tmp.v1).sub(tmp.center).normalize()
      tg.facing = tmp.v2.dot(tmp.cam.copy(camera.position).sub(tmp.v1).normalize())
      tmp.v1.project(camera)
      tg.sx = (tmp.v1.x * 0.5 + 0.5) * size.width
      tg.sy = (-tmp.v1.y * 0.5 + 0.5) * size.height
    }
    tg.cx = cx
    tg.cy = cy
    tg.rpx = rpx

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

    // ---- theme (GSAP tweens themeState.t; materials follow, nothing remounts) ----
    const k = themeState.t
    if (k !== tmp.themeK) {
      tmp.themeK = k
      tone(core.uniforms.uBase, BASE, L_BASE, k)
      tone(core.uniforms.uCyan, CYAN, L_CYAN, k * 0.6)
      tone(core.uniforms.uLime, LIME, L_LIME, k * 0.6)
      tone(atmo.uniforms.uCyan, CYAN, L_ATMO_C, k)
      tone(atmo.uniforms.uLime, LIME, L_ATMO_L, k)
      tone(fieldMat.uniforms.uCyan, CYAN, L_CYAN, k)
      tone(fieldMat.uniforms.uLime, LIME, L_LIME, k)
    }
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
            <points ref={hot} geometry={hotGeo} material={hotMat} renderOrder={3} />
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
      <ThemeInvalidate />
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
