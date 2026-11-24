import * as THREE from 'three'

/**
 * V2 material library — physically based presets shared by every V2 scene.
 * Metals get their look almost entirely from the studio environment below,
 * so all objects on the site read as lit in the same room.
 */

/* ---------- virtual studio (prefiltered environment) ---------- */
export type StudioOpts = { key?: number; rim?: number; accent?: number }

/**
 * A small photographic-style studio built from emissive panels and baked with
 * PMREM: a large overhead softbox (key), tall strip lights (the long chrome
 * streaks), a cyan rim strip, a lime kicker and an emerald floor bounce.
 * No external HDRI is needed (and none can be fetched in this workspace).
 */
export function buildStudio(gl: THREE.WebGLRenderer, o: StudioOpts = {}) {
  const key = o.key ?? 1
  const rim = o.rim ?? 1
  const accent = o.accent ?? 1
  const env = new THREE.Scene()
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#020604'), side: THREE.BackSide }),
  )
  env.add(room)
  const panel = (w: number, h: number, color: string, k: number, x: number, y: number, z: number, look = new THREE.Vector3()) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }),
    )
    m.position.set(x, y, z)
    m.lookAt(look)
    env.add(m)
  }
  // key softbox, high and slightly right — the broad highlight
  panel(9, 5, '#f2fff9', 2.6 * key, 4, 9, 6)
  // tall strips: the long, clean reflections that sell polished metal
  panel(0.7, 14, '#ffffff', 7.5 * key, -7.5, 1, 3)
  panel(0.5, 14, '#ffffff', 5 * key, 8, 0, -2)
  panel(0.35, 12, '#e8fff5', 4 * key, 1.5, 0, -9)
  // cyan rim strip behind-left, lime kicker low-right
  panel(0.6, 12, '#3de8ff', 3.6 * rim, -5, 0, -7)
  panel(2.4, 0.9, '#c6ff00', 2.4 * accent, 6, -3.5, 5)
  // emerald floor bounce + dim teal fill
  panel(30, 30, '#0c4632', 0.9, 0, -9, 0)
  panel(10, 6, '#0b3d4a', 0.8, -9, -2, 6)
  const pm = new THREE.PMREMGenerator(gl)
  const rt = pm.fromScene(env, 0.035)
  pm.dispose()
  env.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh) {
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    }
  })
  return rt
}

/* ---------- surface imperfections ---------- */
/**
 * Procedural roughness variation: fine machining noise, a few soft polish
 * patches and long directional brush streaks. Values sit around 0.5–0.8 and
 * multiply each material's base roughness, so no surface is perfectly uniform.
 */
export function imperfectionMap(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = 'rgb(170,170,170)'
  g.fillRect(0, 0, size, size)
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  // brush streaks along u (the texture's x axis = around the band)
  for (let i = 0; i < 900; i++) {
    const y = rnd() * size
    const v = 140 + rnd() * 70
    g.strokeStyle = `rgba(${v},${v},${v},${0.08 + rnd() * 0.12})`
    g.lineWidth = 0.6 + rnd() * 1.4
    g.beginPath()
    g.moveTo(rnd() * size * 0.2, y)
    g.lineTo(size * (0.6 + rnd() * 0.4), y + (rnd() - 0.5) * 3)
    g.stroke()
  }
  // soft polish / handling patches
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 20 + rnd() * 70
    const v = rnd() > 0.5 ? 120 : 205
    const gr = g.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, `rgba(${v},${v},${v},0.35)`)
    gr.addColorStop(1, `rgba(${v},${v},${v},0)`)
    g.fillStyle = gr
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // fine grain
  const img = g.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 22
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, img.data[i] + n))
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  return t
}

/* ---------- presets ---------- */
export type MetalPreset = 'emeraldMetal' | 'chrome' | 'titanium' | 'graphite'

const PRESETS: Record<MetalPreset, THREE.MeshPhysicalMaterialParameters> = {
  // dark emerald anodised metal with a thin lacquer — the brand body
  emeraldMetal: {
    color: '#2c5646',
    metalness: 1,
    roughness: 0.3,
    anisotropy: 0.6,
    clearcoat: 0.85,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.25,
  },
  // polished chrome: near-mirror, slightly tinted toward mint
  chrome: { color: '#dfe9e5', metalness: 1, roughness: 0.1, envMapIntensity: 1.35 },
  // brushed titanium: directional sheen, softer highlight
  titanium: { color: '#a8b4af', metalness: 1, roughness: 0.46, anisotropy: 0.85, envMapIntensity: 1.1 },
  // deep graphite: almost black metal for supporting parts
  graphite: { color: '#2a302d', metalness: 1, roughness: 0.5, envMapIntensity: 0.9 },
}

export function metal(preset: MetalPreset, roughMap?: THREE.Texture | null, low = false) {
  const p = { ...PRESETS[preset] }
  if (low) {
    // cheaper path for weak GPUs: drop the extra BRDF lobes
    delete p.anisotropy
    delete p.clearcoat
    delete p.clearcoatRoughness
  }
  const m = new THREE.MeshPhysicalMaterial(p)
  if (roughMap) {
    m.roughnessMap = roughMap
    // the map averages ~0.67 → scale base roughness so the mean stays on target
    m.roughness = (p.roughness ?? 0.3) / 0.67
  }
  return m
}
