import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { themeState } from '../../../lib/theme'
import ThemeInvalidate from '../../../three/ThemeInvalidate'

const HALO_DARK = new THREE.Color('#2fd6f0')
const RIM_DARK = new THREE.Color('#3de8ff')
const HALO_LIGHT = new THREE.Color('#00788e')
import { geodesic } from './geodesic'

/* ==========================================================================
   AgentForce core — geodesic intelligence sphere (V3, reference-based)

   Three nested geodesic frameworks around a reflective core, as in the
   reference film:
     1 outer cage   — frequency-2 geodesic, flat rectangular struts, graphite chrome
     2 middle cage  — frequency-2 geodesic at a different orientation, emerald metal
                      that reads cyan where the core lights its inner faces
     3 inner frame  — frequency-2 geodesic close to the core, black chrome struts
                      with black ball nodes
     4 core         — dark reflective sphere with a cyan-white fresnel rim and a
                      restrained halo (no post-processing)
   Every cage turns about its own axis at its own rate, so the lattices slide
   across one another the way they do in the reference.
   ========================================================================== */

export type ReactorState = {
  focus: number // 0–1, how busy the network is (core intensity)
  px: number // pointer over the core, -1..1
  py: number
  hover: number
  pulse: number // set to 1 by a new agent task; decays here
  time: number
  enter?: number // 0–1 entrance (GSAP)
  scroll?: number // 0–1 scroll progress through the hero (GSAP)
}

/* ---------- strut: rounded-rectangle bar, extruded along +Z (0 → 1) ---------- */
function strutGeometry(w: number, h: number) {
  const r = Math.min(w, h) * 0.32
  const s = new THREE.Shape()
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 3 })
  g.computeVertexNormals()
  return g
}

/** Instance matrices: each bar runs a → b, its height axis pointing out from the centre. */
function strutMatrices(verts: THREE.Vector3[], edges: [number, number][], radius: number, inset: number) {
  const out: THREE.Matrix4[] = []
  const z = new THREE.Vector3(), y = new THREE.Vector3(), x = new THREE.Vector3(), mid = new THREE.Vector3()
  for (const [i, j] of edges) {
    const a = verts[i].clone().multiplyScalar(radius)
    const b = verts[j].clone().multiplyScalar(radius)
    z.subVectors(b, a)
    const L = z.length()
    z.normalize()
    mid.addVectors(a, b).multiplyScalar(0.5)
    y.copy(mid).addScaledVector(z, -mid.dot(z)).normalize()
    x.crossVectors(y, z).normalize()
    const m = new THREE.Matrix4().makeBasis(x, y, z)
    m.scale(new THREE.Vector3(1, 1, L - inset * 2))
    m.setPosition(a.addScaledVector(z, inset))
    out.push(m)
  }
  return out
}

/* ---------- studio environment (neutral, brand-tinted accents) ---------- */
function useStudio() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const env = new THREE.Scene()
    const room = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 12), new THREE.MeshBasicMaterial({ color: '#030605', side: THREE.BackSide }))
    env.add(room)
    const panel = (w: number, h: number, c: string, k: number, p: [number, number, number]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }))
      m.position.set(...p)
      m.lookAt(0, 0, 0)
      env.add(m)
    }
    panel(8, 4, '#f4fbf8', 2.2, [3, 8, 6]) // soft key overhead
    panel(0.6, 12, '#ffffff', 6.5, [-7, 1, 3]) // strip: long chrome streaks
    panel(0.45, 12, '#ffffff', 4.2, [7.5, 0, -1])
    panel(0.5, 10, '#3de8ff', 3.2, [-4, 0, -8]) // cyan rim
    panel(1.6, 0.6, '#c6ff00', 1.6, [6, -4, 4]) // restrained lime kicker
    panel(24, 24, '#0c3a2b', 0.7, [0, -9, 0]) // emerald floor bounce
    const pm = new THREE.PMREMGenerator(gl)
    const rt = pm.fromScene(env, 0.03)
    pm.dispose()
    env.traverse((o) => {
      const mm = o as THREE.Mesh
      if (mm.isMesh) {
        mm.geometry.dispose()
        ;(mm.material as THREE.Material).dispose()
      }
    })
    scene.environment = rt.texture
    return () => {
      scene.environment = null
      rt.dispose()
    }
  }, [gl, scene])
}

/* ---------- core rim (fresnel) + halo ---------- */
const rimVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const rimFrag = /* glsl */ `
  uniform vec3 uCyan; uniform float uK;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(f, 1.7) * 1.25;
    // cyan body of the rim, near-white where it is brightest
    vec3 col = mix(uCyan, vec3(0.93, 1.0, 1.0), smoothstep(0.3, 0.8, rim));
    gl_FragColor = vec4(col * rim * uK, rim * uK);
  }
`
const haloFrag = /* glsl */ `
  uniform vec3 uCyan; uniform float uK; varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float g = smoothstep(1.0, 0.42, d) * 0.55 + smoothstep(0.62, 0.44, d) * 0.45;
    gl_FragColor = vec4(uCyan * g * uK, g * uK);
  }
`
const haloVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))

function Sphere({ s, low }: { s: React.RefObject<ReactorState>; low: boolean }) {
  useStudio()
  const tilt = useRef<THREE.Group>(null!)
  const outer = useRef<THREE.Group>(null!)
  const mid = useRef<THREE.Group>(null!)
  const inner = useRef<THREE.Group>(null!)
  const core = useRef<THREE.Mesh>(null!)
  const halo = useRef<THREE.Mesh>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const { camera } = useThree()

  const parts = useMemo(() => {
    const g2 = geodesic(2) // 42 vertices · 120 edges
    // the middle cage is the same lattice turned, so its triangles fall between the outer ones
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.55, 0.9, 0.3))
    const g2b = { verts: g2.verts.map((v) => v.clone().applyQuaternion(turn)), edges: g2.edges }
    const L = {
      outer: { R: 1.0, w: 0.026, h: 0.052, inset: 0.012 },
      mid: { R: 0.76, w: 0.016, h: 0.03, inset: 0.012 },
      inner: { R: 0.55, w: 0.016, h: 0.022, inset: 0.026 },
    }
    const geo = {
      outer: strutGeometry(L.outer.w, L.outer.h),
      mid: strutGeometry(L.mid.w, L.mid.h),
      inner: strutGeometry(L.inner.w, L.inner.h),
      node: new THREE.SphereGeometry(1, 14, 10),
      core: new THREE.SphereGeometry(0.44, 64, 48),
      rim: new THREE.SphereGeometry(0.446, 64, 48),
      halo: new THREE.PlaneGeometry(1.6, 1.6),
    }
    return {
      L,
      geo,
      m: {
        outer: strutMatrices(g2.verts, g2.edges, L.outer.R, L.outer.inset),
        mid: strutMatrices(g2b.verts, g2b.edges, L.mid.R, L.mid.inset),
        inner: strutMatrices(g2.verts, g2.edges, L.inner.R, L.inner.inset),
      },
      nodesOuter: g2.verts.map((v) => v.clone().multiplyScalar(L.outer.R)),
      nodesInner: g2.verts.map((v) => v.clone().multiplyScalar(L.inner.R)),
    }
  }, [])

  const mats = useMemo(() => {
    const phys = (p: THREE.MeshPhysicalMaterialParameters) => {
      if (low) {
        delete p.clearcoat
        delete p.clearcoatRoughness
      }
      return new THREE.MeshPhysicalMaterial(p)
    }
    return {
      // graphite / black chrome cage with neutral reflections
      outer: phys({ color: '#c2cbc7', metalness: 1, roughness: 0.17, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 1.25 }),
      // dark emerald metal — the core's cyan light reads on its inner faces
      mid: phys({ color: '#24503f', metalness: 0.95, roughness: 0.32, envMapIntensity: 0.95 }),
      // black chrome
      inner: phys({ color: '#101514', metalness: 1, roughness: 0.16, clearcoat: 0.8, clearcoatRoughness: 0.06, envMapIntensity: 1.4 }),
      nodeOuter: phys({ color: '#c9d4cf', metalness: 1, roughness: 0.14, envMapIntensity: 1.3 }),
      nodeInner: phys({ color: '#070a09', metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5 }),
      // smooth reflective core: very dark teal, mirror-like
      core: phys({ color: '#0a2326', metalness: 0.8, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.5, emissive: new THREE.Color('#06343c'), emissiveIntensity: 0.2 }),
      rim: new THREE.ShaderMaterial({
        vertexShader: rimVert,
        fragmentShader: rimFrag,
        uniforms: { uCyan: { value: new THREE.Color('#3de8ff') }, uK: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      halo: new THREE.ShaderMaterial({
        vertexShader: haloVert,
        fragmentShader: haloFrag,
        uniforms: { uCyan: { value: new THREE.Color('#2fd6f0') }, uK: { value: 0.5 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    }
  }, [low])

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose())
    },
    [mats],
  )
  useEffect(
    () => () => {
      Object.values(parts.geo).forEach((g) => g.dispose())
    },
    [parts],
  )

  // write instance matrices once
  const setStruts = (ms: THREE.Matrix4[]) => (im: THREE.InstancedMesh | null) => {
    if (!im) return
    ms.forEach((m, i) => im.setMatrixAt(i, m))
    im.instanceMatrix.needsUpdate = true
    im.computeBoundingSphere()
  }
  const setNodes = (pts: THREE.Vector3[], r: number) => (im: THREE.InstancedMesh | null) => {
    if (!im) return
    const m = new THREE.Matrix4()
    pts.forEach((p, i) => {
      m.makeScale(r, r, r).setPosition(p)
      im.setMatrixAt(i, m)
    })
    im.instanceMatrix.needsUpdate = true
    im.computeBoundingSphere()
  }

  const st = useRef({ px: 0, py: 0, pulse: 0, focus: 0.35, spin: 0 })
  useFrame((state, delta) => {
    const S = s.current!
    const dt = Math.min(delta, 1 / 20)
    const live = state.frameloop !== 'demand' // reduced motion renders on demand: hold a still pose
    const t = state.clock.elapsedTime
    const enter = S.enter ?? 1
    const scroll = S.scroll ?? 0
    const k = st.current
    k.px = damp(k.px, S.px, 3, dt)
    k.py = damp(k.py, S.py, 3, dt)
    k.focus = damp(k.focus, S.focus, 2.5, dt)
    if (S.pulse > 0) {
      k.pulse = Math.max(k.pulse, S.pulse)
      S.pulse = 0
    }
    k.pulse = Math.max(0, k.pulse - dt * 1.3)

    /* independent cage rotations (as in the reference: slow, continuous, counter-moving) */
    const spd = 1 + scroll * 0.6
    if (live) {
      outer.current.rotation.y += dt * 0.17 * spd
      outer.current.rotation.x += dt * 0.045 * spd
      mid.current.rotation.y -= dt * 0.23 * spd
      mid.current.rotation.z += dt * 0.07 * spd
      inner.current.rotation.x += dt * 0.21 * spd
      inner.current.rotation.y += dt * 0.11 * spd
      core.current.rotation.y += dt * 0.12
    }

    /* entrance: cages assemble from outside in, the core lights last */
    const e = (a: number, b: number) => THREE.MathUtils.smootherstep(enter, a, b)
    outer.current.scale.setScalar(THREE.MathUtils.lerp(1.28, 1, e(0, 0.7)) * (1 + scroll * 0.06))
    mid.current.scale.setScalar(THREE.MathUtils.lerp(0.55, 1, e(0.12, 0.82)) * (1 + k.pulse * 0.025))
    inner.current.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, e(0.22, 0.9)) * (1 - scroll * 0.05))
    const coreOn = e(0.35, 1)

    /* pointer: damped orientation; scroll: the camera arcs down over the sphere */
    tilt.current.rotation.x = 0.22 + k.py * 0.22 + scroll * 0.55
    tilt.current.rotation.y = -0.18 + k.px * 0.32
    tilt.current.rotation.z = Math.sin(t * 0.21) * 0.03
    camera.position.z = 4.7 - scroll * 0.3 // stays inside the core's frame between the consoles
    camera.position.y = scroll * 0.25
    camera.lookAt(0, 0, 0)

    /* core light: busy network → brighter; a new task → short flare */
    const glow = coreOn * (1.25 + k.focus * 0.5 + k.pulse * 0.55 + (live ? Math.sin(t * 1.3) * 0.04 : 0))
    // light theme: the additive halo would wash out on a pale page, so it is
    // re-toned to deep teal and held lower; the metal core is unchanged
    const tk = themeState.t
    mats.rim.uniforms.uK.value = glow * (1 - 0.35 * tk)
    mats.halo.uniforms.uK.value = glow * 0.42 * (1 - 0.45 * tk)
    ;(mats.halo.uniforms.uCyan.value as THREE.Color).copy(HALO_DARK).lerp(HALO_LIGHT, tk)
    ;(mats.rim.uniforms.uCyan.value as THREE.Color).copy(RIM_DARK).lerp(HALO_LIGHT, tk * 0.7)
    light.current.intensity = glow * 2.6
    mats.core.emissiveIntensity = 0.12 + glow * 0.12
    halo.current.quaternion.copy(camera.quaternion)
  })

  const L = parts.L
  return (
    <>
      <ambientLight intensity={0.06} />
      <directionalLight color="#f3fbf7" intensity={1.7} position={[3, 5, 6]} />
      <directionalLight color="#3de8ff" intensity={0.7} position={[-5, 1.5, -4]} />
      <directionalLight color="#c6ff00" intensity={0.12} position={[5, -3, 2]} />
      <group ref={tilt}>
        <mesh ref={halo} geometry={parts.geo.halo} material={mats.halo} renderOrder={-1} />
        <group ref={outer}>
          <instancedMesh ref={setStruts(parts.m.outer)} args={[parts.geo.outer, mats.outer, parts.m.outer.length]} />
          <instancedMesh ref={setNodes(parts.nodesOuter, L.outer.h * 0.62)} args={[parts.geo.node, mats.nodeOuter, parts.nodesOuter.length]} />
        </group>
        <group ref={mid}>
          <instancedMesh ref={setStruts(parts.m.mid)} args={[parts.geo.mid, mats.mid, parts.m.mid.length]} />
        </group>
        <group ref={inner}>
          <instancedMesh ref={setStruts(parts.m.inner)} args={[parts.geo.inner, mats.inner, parts.m.inner.length]} />
          <instancedMesh ref={setNodes(parts.nodesInner, 0.034)} args={[parts.geo.node, mats.nodeInner, parts.nodesInner.length]} />
        </group>
        <mesh ref={core} geometry={parts.geo.core} material={mats.core} />
        <mesh geometry={parts.geo.rim} material={mats.rim} />
        <pointLight ref={light} color="#46e6ff" distance={2.4} decay={1.6} intensity={6} />
      </group>
    </>
  )
}

/** slow windows → lower DPR, then the light material path */
function PerfGuard({ onSlow, onVerySlow }: { onSlow: () => void; onVerySlow: () => void }) {
  const a = useRef({ t: 0, n: 0, stage: 0, warm: 0 })
  useFrame((_, d) => {
    const s = a.current
    if (s.stage >= 2) return
    s.warm += d
    if (s.warm < 1.5) return
    s.t += d
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

export default function GeodesicCore({ s, frameloop, onReady }: { s: React.RefObject<ReactorState>; frameloop: 'always' | 'never' | 'demand'; onReady?: (gl: THREE.WebGLRenderer) => void }) {
  const [dpr, setDpr] = useState(1.75)
  const [low, setLow] = useState(false)
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, dpr]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, position: [0, 0, 4.7], near: 0.1, far: 30 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        onReady?.(gl)
      }}
    >
      <ThemeInvalidate />
      <PerfGuard onSlow={() => setDpr(1)} onVerySlow={() => setLow(true)} />
      <Sphere s={s} low={low} />
    </Canvas>
  )
}
