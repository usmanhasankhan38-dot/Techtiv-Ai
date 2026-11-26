import * as THREE from 'three'

/**
 * V3 Technology explorer — one interactive hotspot per technology, fixed on
 * the globe's surface (inside the spinning group, so they turn with the land).
 *
 * Placement: a Fibonacci (golden-angle) lattice, latitude kept inside ±62°, so
 * neighbours sit ~30° apart — evenly spread, never crowded, and the poles stay
 * clear for the vertical drag. Drawn as one THREE.Points draw call.
 */
export function hotspotGeometry(count: number, radius = 1.03) {
  const pos = new Float32Array(count * 3)
  const idx = new Float32Array(count)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const yMax = 0.88
  for (let i = 0; i < count; i++) {
    const y = yMax - (i / (count - 1)) * yMax * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i + 0.6
    pos.set([Math.cos(th) * r * radius, y * radius, Math.sin(th) * r * radius], i * 3)
    idx[i] = i
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aIdx', new THREE.BufferAttribute(idx, 1))
  g.computeBoundingSphere()
  return g
}

/* A hotspot reads as an instrument marker, not a land dot: a lime core inside a
   thin cyan ring. Hover/active: the core brightens, the ring tightens and a
   single soft pulse expands. Points on the far side are depth-hidden by the
   globe's core sphere and faded toward the limb. */
const vert = /* glsl */ `
  attribute float aIdx;
  uniform float uSize;
  uniform float uPx;
  uniform float uIntro;
  uniform float uCount;
  uniform float uHover;
  uniform float uActive;
  varying float vFacing;
  varying float vState;
  varying float vK;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = dot(n, normalize(-mv.xyz));
    // staggered arrival, in lattice order (top → bottom)
    vK = clamp(uIntro * 1.7 - (aIdx / uCount) * 0.7, 0.0, 1.0);
    vK = vK * vK * (3.0 - 2.0 * vK);
    float h = 1.0 - step(0.5, abs(aIdx - uHover));
    float a = 1.0 - step(0.5, abs(aIdx - uActive));
    vState = max(h * 0.75, a);
    float s = uSize * (1.0 + vState * 0.55) * vK * smoothstep(0.02, 0.3, vFacing);
    gl_PointSize = s * uPx;
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */ `
  uniform vec3 uLime;
  uniform vec3 uCyan;
  uniform vec3 uMint;
  uniform float uTime;
  varying float vFacing;
  varying float vState;
  varying float vK;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p) * 2.0;               // 0 centre → 1 sprite edge
    float core = smoothstep(0.2, 0.13, d);
    float ringR = mix(0.5, 0.4, vState);
    float ring = smoothstep(0.05, 0.0, abs(d - ringR)) * mix(0.55, 0.95, vState);
    float pr = fract(uTime * 0.7);
    float pulse = vState * smoothstep(0.045, 0.0, abs(d - (0.42 + pr * 0.56))) * (1.0 - pr) * 0.8;
    vec3 coreC = mix(mix(uMint, uLime, 0.55), uLime, vState);
    vec3 col = coreC * core * (1.0 + vState * 0.6) + uCyan * ring + uLime * pulse;
    float alpha = max(core, max(ring, pulse));
    float limb = smoothstep(0.02, 0.32, vFacing);
    if (alpha * limb * vK < 0.01) discard;
    gl_FragColor = vec4(col, alpha * limb * vK);
  }
`

export function hotspotMaterial(count: number) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    uniforms: {
      uSize: { value: 26 },
      uPx: { value: 1 },
      uIntro: { value: 0 },
      uCount: { value: count },
      uHover: { value: -1 },
      uActive: { value: -1 },
      uTime: { value: 0 },
      uLime: { value: new THREE.Color('#c6ff00') },
      uCyan: { value: new THREE.Color('#3de8ff') },
      uMint: { value: new THREE.Color('#e8fff5') },
    },
  })
}
