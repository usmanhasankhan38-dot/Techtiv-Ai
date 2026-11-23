import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ==========================================================================
   AgentForce — Living Intelligence Reactor (Phase 1)
   Layers, inside → out, each on its own clock:
   1 plasma core      — noise-driven emissive shader, slow "heartbeat"
   2 core halo        — camera-facing additive glow (no post-processing)
   3 neural lattice   — icosahedral edge cage with travelling pulses + nodes
   4 glass shell      — fresnel rim, faint graticule, vertical scan band
   5 gyroscope rings  — three tilted metal rings, precessing independently,
                        precision tick marks, carriers riding the rings
   6 orbital streams  — GPU-animated particles in three inclined bands
   Light: lime point light inside (key), cool cyan key from top-left.
   Shared state (focus / pointer / pulse) is read from a ref, so React never
   re-renders per frame.
   ========================================================================== */

export type ReactorState = { focus: number; px: number; py: number; hover: number; pulse: number; time: number }

const LIME = new THREE.Color('#c6ff00')
const CYAN = new THREE.Color('#3de8ff')
const MINT = new THREE.Color('#e8fff5')

/* compact 3D simplex noise (Ashima / Stefan Gustavson, MIT) */
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
`

/* ---------------------------------------------------------------- 1 core */
function PlasmaCore({ s }: { s: React.RefObject<ReactorState> }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0.4 }, uLime: { value: LIME }, uCyan: { value: CYAN }, uMint: { value: MINT } }), [])
  useFrame(() => {
    const st = s.current!
    uniforms.uTime.value = st.time
    uniforms.uEnergy.value = st.focus + st.hover * 0.2 + st.pulse * 0.6
    // heartbeat: a soft double pulse every ~2.6s, quicker when focused
    const beat = Math.pow(Math.max(0, Math.sin(st.time * (2.4 + st.focus * 1.6))), 12)
    mesh.current!.scale.setScalar(1 + beat * 0.035 + st.pulse * 0.08)
  })
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[0.4, 16]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          varying vec3 vP; varying vec3 vN; varying vec3 vV;
          ${NOISE}
          void main(){
            vec3 p=position;
            float d=snoise(p*2.4+vec3(0.,uTime*.3,0.))*.014;
            p+=normal*d;
            vP=position; vN=normalize(normalMatrix*normal);
            vec4 mv=modelViewMatrix*vec4(p,1.);
            vV=normalize(-mv.xyz);
            gl_Position=projectionMatrix*mv;
          }`}
        fragmentShader={`
          uniform float uTime; uniform float uEnergy; uniform vec3 uLime; uniform vec3 uCyan; uniform vec3 uMint;
          varying vec3 vP; varying vec3 vN; varying vec3 vV;
          ${NOISE}
          void main(){
            float t=uTime*(.22+.25*uEnergy);
            vec3 q=vP*2.6;
            float n=snoise(q+vec3(t,-t*.7,t*.4));
            n+=.5*snoise(q*2.1+vec3(-t*1.3,t,0.)+n);
            n+=.25*snoise(q*4.3+vec3(0.,t*2.,-t)+n);
            n=.5+.5*n/1.75;
            float ndv=max(dot(vN,vV),0.);
            vec3 deep=vec3(.03,.16,.09);
            vec3 c=mix(deep,uCyan*.85,smoothstep(.3,.6,n));
            c=mix(c,uLime,smoothstep(.4,.7,n));
            c+=uMint*pow(smoothstep(.7,1.,n),2.5)*.9;
            // hot centre: the reactor reads as a light source, not a marble
            c+=mix(uLime,uMint,.35)*pow(ndv,3.)*(.35+.35*uEnergy);
            float fres=pow(1.-ndv,2.2);
            c+=uCyan*fres*.8;
            c*=.9+.55*uEnergy;
            gl_FragColor=vec4(c,1.);
          }`}
      />
    </mesh>
  )
}

/* ---------------------------------------------------------------- 2 halo */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.25, 'rgba(255,255,255,0.45)')
    r.addColorStop(0.6, 'rgba(255,255,255,0.08)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}
function Halo({ s, map }: { s: React.RefObject<ReactorState>; map: THREE.Texture }) {
  const a = useRef<THREE.Sprite>(null)
  const b = useRef<THREE.Sprite>(null)
  useFrame(() => {
    const st = s.current!
    const e = st.focus + st.hover * 0.25 + st.pulse * 0.8
    ;(a.current!.material as THREE.SpriteMaterial).opacity = 0.32 + 0.3 * e
    ;(b.current!.material as THREE.SpriteMaterial).opacity = 0.1 + 0.12 * e
    b.current!.scale.setScalar(3.4 + st.pulse * 0.8)
  })
  return (
    <>
      <sprite ref={a} scale={1.55}>
        <spriteMaterial map={map} color={LIME} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={b} scale={3.4}>
        <spriteMaterial map={map} color={CYAN} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  )
}

/* ---------------------------------------------------------------- 3 lattice */
function Lattice({ s }: { s: React.RefObject<ReactorState> }) {
  const g = useRef<THREE.Group>(null)
  const { edges, nodes } = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.68, 1)
    const edges = new THREE.EdgesGeometry(ico)
    // unique vertices for the node points
    const pos = ico.getAttribute('position')
    const seen = new Map<string, THREE.Vector3>()
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i)
      seen.set(`${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`, v)
    }
    const pts = [...seen.values()]
    const nodes = new THREE.BufferGeometry()
    nodes.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((v) => [v.x, v.y, v.z]), 3))
    nodes.setAttribute('aPhase', new THREE.Float32BufferAttribute(pts.map((_, i) => (i * 0.618) % 1), 1))
    ico.dispose()
    return { edges, nodes }
  }, [])
  const lineU = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0.4 }, uLime: { value: LIME }, uCyan: { value: CYAN } }), [])
  const nodeU = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0.4 }, uPx: { value: 1 } }), [])
  const { gl } = useThree()
  nodeU.uPx.value = gl.getPixelRatio()
  useFrame((_, dt) => {
    const st = s.current!
    lineU.uTime.value = nodeU.uTime.value = st.time
    lineU.uEnergy.value = nodeU.uEnergy.value = st.focus + st.pulse * 0.6
    g.current!.rotation.y -= dt * (0.08 + st.focus * 0.06)
    g.current!.rotation.x = Math.sin(st.time * 0.13) * 0.25
  })
  return (
    <group ref={g}>
      <lineSegments geometry={edges}>
        <shaderMaterial
          uniforms={lineU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `}
          fragmentShader={`
            uniform float uTime; uniform float uEnergy; uniform vec3 uLime; uniform vec3 uCyan; varying vec3 vP;
            void main(){
              // two pulse fronts sweep the cage on different axes
              float a=pow(.5+.5*sin(dot(vP,vec3(.8,.5,.3))*9.-uTime*2.2),8.);
              float b=pow(.5+.5*sin(dot(vP,vec3(-.3,.9,.2))*7.+uTime*1.6),10.);
              vec3 c=uCyan*(.16+.12*uEnergy)+uLime*(a*.9+b*.5)*(.5+.6*uEnergy);
              gl_FragColor=vec4(c,1.);
            }`}
        />
      </lineSegments>
      <points geometry={nodes}>
        <shaderMaterial
          uniforms={nodeU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            uniform float uTime; uniform float uPx; attribute float aPhase; varying float vA;
            void main(){
              vec4 mv=modelViewMatrix*vec4(position,1.);
              float tw=.5+.5*sin(uTime*1.7+aPhase*6.283);
              vA=.35+.65*tw;
              gl_PointSize=(5.+6.*tw)*uPx*(3.2/-mv.z);
              gl_Position=projectionMatrix*mv;
            }`}
          fragmentShader={`
            uniform float uEnergy; varying float vA;
            void main(){
              float d=length(gl_PointCoord-.5);
              float a=smoothstep(.5,0.,d);
              vec3 c=mix(vec3(.24,.91,1.),vec3(.78,1.,0.),vA)*(1.+uEnergy*.6);
              gl_FragColor=vec4(c*a*vA,a*vA);
            }`}
        />
      </points>
    </group>
  )
}

/* ---------------------------------------------------------------- 4 shell */
function Shell({ s }: { s: React.RefObject<ReactorState> }) {
  const u = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0.4 }, uLime: { value: LIME }, uCyan: { value: CYAN }, uMint: { value: MINT } }), [])
  useFrame(() => {
    const st = s.current!
    u.uTime.value = st.time
    u.uEnergy.value = st.focus + st.hover * 0.2 + st.pulse
  })
  return (
    <mesh>
      <sphereGeometry args={[1, 72, 48]} />
      <shaderMaterial
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec3 vN; varying vec3 vV; varying vec3 vP;
          void main(){
            vP=position; vN=normalize(normalMatrix*normal);
            vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz);
            gl_Position=projectionMatrix*mv;
          }`}
        fragmentShader={`
          uniform float uTime; uniform float uEnergy; uniform vec3 uLime; uniform vec3 uCyan; uniform vec3 uMint;
          varying vec3 vN; varying vec3 vV; varying vec3 vP;
          void main(){
            float ndv=max(dot(vN,vV),0.);
            float fres=pow(1.-ndv,4.6);
            // key light from the top-left: brighter rim on that side
            float key=.35+.65*max(dot(vN,normalize(vec3(-.6,.7,.4))),0.);
            vec3 rim=mix(uCyan,uLime,.35+.25*vP.y)*fres*key*(1.+.5*uEnergy);
            // faint graticule (latitude only) — reads as engineered glass
            float lat=abs(fract(vP.y*6.)-.5);
            float grid=smoothstep(.015,0.,lat)*.05*(1.-fres)*ndv;
            // slow scan band travelling down the shell
            float band=exp(-pow((vP.y-(1.2-mod(uTime*.28,2.4)))*9.,2.));
            vec3 c=rim+uCyan*grid+uLime*band*.09*ndv;
            // specular glint
            float spec=pow(max(dot(reflect(-normalize(vec3(-.5,.6,.65)),vN),vV),0.),60.);
            c+=uMint*spec*.7;
            gl_FragColor=vec4(c,1.);
          }`}
      />
    </mesh>
  )
}

/* ---------------------------------------------------------------- 5 rings */
type RingDef = { r: number; tube: number; tilt: [number, number, number]; spin: number; precess: number; color: THREE.Color; carriers: number; ticks: boolean }
const RINGS: RingDef[] = [
  { r: 1.2, tube: 0.012, tilt: [1.2, 0.2, 0.3], spin: 0.32, precess: 0.05, color: LIME, carriers: 2, ticks: false },
  { r: 1.34, tube: 0.009, tilt: [0.35, 0.9, -0.2], spin: -0.22, precess: -0.035, color: CYAN, carriers: 3, ticks: false },
  { r: 1.5, tube: 0.007, tilt: [1.62, -0.4, 0.9], spin: 0.12, precess: 0.025, color: CYAN, carriers: 1, ticks: true },
]
function Ring({ d, s, i }: { d: RingDef; s: React.RefObject<ReactorState>; i: number }) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const ticks = useRef<THREE.InstancedMesh>(null)
  const tickN = 72
  useLayoutEffect(() => {
    // tick instances are positioned once
    {
      if (!ticks.current) return
      const m = new THREE.Matrix4()
      const q = new THREE.Quaternion()
      for (let k = 0; k < tickN; k++) {
        const a = (k / tickN) * Math.PI * 2
        const long = k % 6 === 0
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a)
        m.compose(new THREE.Vector3(Math.cos(a) * (d.r + 0.035), Math.sin(a) * (d.r + 0.035), 0), q, new THREE.Vector3(long ? 0.06 : 0.03, 0.006, 0.006))
        ticks.current.setMatrixAt(k, m)
      }
      ticks.current.instanceMatrix.needsUpdate = true
    }
  }, [d.r])
  useFrame((_, dt) => {
    const st = s.current!
    const k = 1 + st.focus * 0.8 + st.pulse * 2
    inner.current!.rotation.z += dt * d.spin * k
    outer.current!.rotation.y += dt * d.precess * k
  })
  return (
    <group ref={outer}>
      <group rotation={d.tilt}>
        <group ref={inner}>
          <mesh>
            <torusGeometry args={[d.r, d.tube, 12, 220]} />
            <meshStandardMaterial color="#0e2218" metalness={0.9} roughness={0.28} emissive={d.color} emissiveIntensity={0.55} />
          </mesh>
          {/* hairline companion ring for a machined, double-edged read */}
          <mesh>
            <torusGeometry args={[d.r - 0.03, d.tube * 0.35, 6, 220]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {Array.from({ length: d.carriers }, (_, c) => {
            const a = (c / d.carriers) * Math.PI * 2 + i
            return (
              <group key={c} position={[Math.cos(a) * d.r, Math.sin(a) * d.r, 0]}>
                <mesh>
                  <sphereGeometry args={[0.03, 16, 12]} />
                  <meshBasicMaterial color={MINT} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.07, 16, 12]} />
                  <meshBasicMaterial color={d.color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
              </group>
            )
          })}
          {d.ticks && (
            <instancedMesh ref={ticks} args={[undefined, undefined, tickN]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color={CYAN} transparent opacity={0.55} />
            </instancedMesh>
          )}
        </group>
      </group>
    </group>
  )
}

/* ---------------------------------------------------------------- 6 streams */
function Streams({ s }: { s: React.RefObject<ReactorState> }) {
  const N = 420
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(N * 3)
    const a0 = new Float32Array(N)
    const rad = new Float32Array(N)
    const spd = new Float32Array(N)
    const band = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const b = i % 3
      band[i] = b
      a0[i] = Math.random() * Math.PI * 2
      rad[i] = [1.12, 1.28, 1.42][b] + (Math.random() - 0.5) * 0.09
      spd[i] = [0.42, -0.3, 0.2][b] * (0.8 + Math.random() * 0.4)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aA0', new THREE.BufferAttribute(a0, 1))
    g.setAttribute('aR', new THREE.BufferAttribute(rad, 1))
    g.setAttribute('aS', new THREE.BufferAttribute(spd, 1))
    g.setAttribute('aB', new THREE.BufferAttribute(band, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
    return g
  }, [])
  const { gl } = useThree()
  const u = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0.4 }, uPx: { value: gl.getPixelRatio() } }), [gl])
  useFrame(() => {
    u.uTime.value = s.current!.time
    u.uEnergy.value = s.current!.focus + s.current!.pulse
  })
  return (
    <points geometry={geo}>
      <shaderMaterial
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          uniform float uTime; uniform float uEnergy; uniform float uPx;
          attribute float aA0; attribute float aR; attribute float aS; attribute float aB;
          varying float vF; varying float vB;
          mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
          mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
          void main(){
            float a=aA0+uTime*aS*(1.+uEnergy*.8);
            vec3 p=vec3(cos(a)*aR,sin(a)*aR*.98,0.);
            vec3 tilt=aB<.5?vec3(1.25,.0,.35):aB<1.5?vec3(.4,0.,-.9):vec3(1.65,0.,1.2);
            p=rz(tilt.z)*rx(tilt.x)*p;
            vec4 mv=modelViewMatrix*vec4(p,1.);
            vF=clamp(.5+p.z*.55,0.,1.); // front brighter than back
            vB=aB;
            gl_PointSize=(2.2+2.6*vF)*uPx*(6.6/-mv.z);
            gl_Position=projectionMatrix*mv;
          }`}
        fragmentShader={`
          varying float vF; varying float vB;
          void main(){
            float d=length(gl_PointCoord-.5);
            float a=smoothstep(.5,0.,d)*(.15+.85*vF);
            vec3 c=vB<.5?vec3(.78,1.,0.):vec3(.24,.91,1.);
            gl_FragColor=vec4(c*a,a);
          }`}
      />
    </points>
  )
}

/* ---------------------------------------------------------------- pulse */
function Shockwave({ s }: { s: React.RefObject<ReactorState> }) {
  const m = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    const p = s.current!.pulse
    const mesh = m.current!
    mesh.visible = p > 0.02
    if (!mesh.visible) return
    mesh.quaternion.copy(camera.quaternion)
    mesh.scale.setScalar(0.55 + (1 - p) * 1.25)
    ;(mesh.material as THREE.MeshBasicMaterial).opacity = p * 0.7
  })
  return (
    <mesh ref={m} visible={false}>
      <ringGeometry args={[0.97, 1, 128]} />
      <meshBasicMaterial color={LIME} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- rig */
function Rig({ s }: { s: React.RefObject<ReactorState> }) {
  const g = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    const st = s.current!
    if (st.time >= 0) st.time += Math.min(dt, 0.05)
    st.pulse *= Math.pow(0.12, Math.min(dt, 0.05)) // ~1s decay
    // subtle interactive response: the whole reactor leans toward the cursor
    g.current!.rotation.y += (st.px * 0.35 - g.current!.rotation.y) * Math.min(1, dt * 3)
    g.current!.rotation.x += (-st.py * 0.28 - g.current!.rotation.x) * Math.min(1, dt * 3)
    g.current!.position.y = Math.sin(st.time * 0.6) * 0.03
    light.current!.intensity = 4 + st.focus * 5 + st.pulse * 8
  })
  const glow = useGlowTexture()
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-3, 4, 3]} intensity={1.1} color="#d8fbff" />
      <group ref={g}>
        <pointLight ref={light} color={LIME} intensity={5} distance={4} decay={1.6} />
        <Halo s={s} map={glow} />
        <PlasmaCore s={s} />
        <Lattice s={s} />
        <Shell s={s} />
        {RINGS.map((d, i) => (
          <Ring key={i} d={d} s={s} i={i} />
        ))}
        <Streams s={s} />
        <Shockwave s={s} />
      </group>
    </>
  )
}

export default function ReactorScene({ s, frameloop, onReady }: { s: React.RefObject<ReactorState>; frameloop: 'always' | 'never' | 'demand'; onReady?: (gl: THREE.WebGLRenderer) => void }) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, position: [0, 0, 6.66], near: 0.1, far: 20 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        onReady?.(gl)
      }}
    >
      <Rig s={s} />
    </Canvas>
  )
}
