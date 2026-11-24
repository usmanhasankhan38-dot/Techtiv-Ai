import * as THREE from 'three'

/**
 * Forged Möbius band — the TechtivAI intelligence core.
 *
 * A ring whose rounded-rectangle (superellipse) cross-section makes one half
 * turn per revolution, so its two faces become one continuous surface: a
 * single, unbroken loop of intelligence. Built as one indexed mesh with the
 * seam stitched to the half-turned section, so normals stay smooth all round.
 */
export const BAND = { R: 1, a: 0.36, b: 0.115, n: 3.4 }
/** outer radius in local units (used to fit the object to a screen anchor) */
export const BAND_EXTENT = BAND.R + BAND.a + 0.02

const sgnPow = (x: number, p: number) => Math.sign(x) * Math.pow(Math.abs(x), p)

function section(v: number, out: THREE.Vector2) {
  const e = 2 / BAND.n
  return out.set(BAND.a * sgnPow(Math.cos(v), e), BAND.b * sgnPow(Math.sin(v), e))
}

/** point on the band: u around the ring, (sx, sy) in the section plane */
export function bandPoint(u: number, sx: number, sy: number, out: THREE.Vector3) {
  const th = u / 2 // half twist per revolution
  const cu = Math.cos(u)
  const su = Math.sin(u)
  const ct = Math.cos(th)
  const st = Math.sin(th)
  // radial axis N = (cu, su, 0), binormal B = (0, 0, 1)
  const along = sx * ct - sy * st // along N
  const up = sx * st + sy * ct // along B
  return out.set((BAND.R + along) * cu, (BAND.R + along) * su, up)
}

export function mobiusGeometry(uSeg = 320, vSeg = 48) {
  if (vSeg % 2) vSeg++
  const pos = new Float32Array(uSeg * vSeg * 3)
  const uv = new Float32Array(uSeg * vSeg * 2)
  const p = new THREE.Vector3()
  const s = new THREE.Vector2()
  for (let i = 0; i < uSeg; i++) {
    const u = (i / uSeg) * Math.PI * 2
    for (let j = 0; j < vSeg; j++) {
      const v = (j / vSeg) * Math.PI * 2
      section(v, s)
      bandPoint(u, s.x, s.y, p)
      const k = i * vSeg + j
      pos.set([p.x, p.y, p.z], k * 3)
      uv.set([i / uSeg, j / vSeg], k * 2)
    }
  }
  const idx: number[] = []
  const half = vSeg / 2
  for (let i = 0; i < uSeg; i++) {
    const last = i === uSeg - 1
    const i1 = last ? 0 : i + 1
    for (let j = 0; j < vSeg; j++) {
      const j1 = (j + 1) % vSeg
      // after a full turn the section has rotated by π: stitch v → v + π
      const nj = last ? (j + half) % vSeg : j
      const nj1 = last ? (j1 + half) % vSeg : j1
      const a = i * vSeg + j
      const b = i * vSeg + j1
      const c = i1 * vSeg + nj
      const d = i1 * vSeg + nj1
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

/**
 * The inlaid filament: the centre line of the band's face. On a Möbius band
 * that line visits both "sides" before it closes, so it runs 4π.
 */
export function filamentCurve() {
  const pts: THREE.Vector3[] = []
  const N = 480
  for (let i = 0; i < N; i++) {
    const u = (i / N) * Math.PI * 4
    pts.push(bandPoint(u, 0, BAND.b * 1.02, new THREE.Vector3()))
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal')
}

/** Precision ring with a squared, bevelled profile (lathe of a superellipse). */
export function bevelRing(radius: number, w: number, h: number, seg = 160, n = 4) {
  const prof: THREE.Vector2[] = []
  const P = 40
  const e = 2 / n
  for (let k = 0; k <= P; k++) {
    const t = -Math.PI / 2 + (k / P) * Math.PI * 2
    prof.push(new THREE.Vector2(radius + w * sgnPow(Math.cos(t), e), h * sgnPow(Math.sin(t), e)))
  }
  const g = new THREE.LatheGeometry(prof, seg)
  g.rotateX(Math.PI / 2)
  g.computeVertexNormals()
  return g
}
