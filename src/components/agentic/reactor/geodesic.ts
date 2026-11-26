import * as THREE from 'three'

/* ---------- geodesic sphere: vertices + unique edges ---------- */
export function geodesic(freq: number) {
  const t = (1 + Math.sqrt(5)) / 2
  const base = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => new THREE.Vector3(...(v as [number, number, number])).normalize())
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ]
  const verts: THREE.Vector3[] = []
  const index = new Map<string, number>()
  const vid = (v: THREE.Vector3) => {
    const n = v.clone().normalize()
    const k = `${n.x.toFixed(4)},${n.y.toFixed(4)},${n.z.toFixed(4)}`
    let i = index.get(k)
    if (i === undefined) {
      i = verts.length
      verts.push(n)
      index.set(k, i)
    }
    return i
  }
  const edges = new Set<string>()
  const edge = (a: number, b: number) => edges.add(a < b ? `${a}_${b}` : `${b}_${a}`)
  for (const [ia, ib, ic] of faces) {
    const A = base[ia], B = base[ib], C = base[ic]
    const grid: number[][] = []
    for (let i = 0; i <= freq; i++) {
      grid[i] = []
      for (let j = 0; j <= freq - i; j++) {
        const p = new THREE.Vector3()
          .addScaledVector(A, (freq - i - j) / freq)
          .addScaledVector(B, i / freq)
          .addScaledVector(C, j / freq)
        grid[i][j] = vid(p)
      }
    }
    for (let i = 0; i < freq; i++)
      for (let j = 0; j < freq - i; j++) {
        const a = grid[i][j], b = grid[i + 1][j], c = grid[i][j + 1]
        edge(a, b); edge(b, c); edge(c, a)
        if (j < freq - i - 1) {
          const d = grid[i + 1][j + 1]
          edge(b, d); edge(d, c)
        }
      }
  }
  return { verts, edges: [...edges].map((e) => e.split('_').map(Number) as [number, number]) }
}

/** Static 2D projection of the same lattices — the no-WebGL fallback draws these. */
export function geodesicSvgPaths(size = 100) {
  const g = geodesic(2)
  const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.38, -0.5, 0.05))
  const mid = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.95, 0.4, 0.3))
  const c = size / 2
  const proj = (v: THREE.Vector3, r: number, q: THREE.Quaternion) => {
    const p = v.clone().applyQuaternion(q).multiplyScalar(r)
    return { x: c + p.x * c * 0.9, y: c - p.y * c * 0.9, z: p.z }
  }
  const layer = (r: number, q: THREE.Quaternion) =>
    g.edges.map(([i, j]) => {
      const a = proj(g.verts[i], r, q)
      const b = proj(g.verts[j], r, q)
      return { d: `M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`, front: (a.z + b.z) / 2 > 0 }
    })
  return { outer: layer(1, rot), mid: layer(0.76, mid), inner: layer(0.55, rot) }
}
