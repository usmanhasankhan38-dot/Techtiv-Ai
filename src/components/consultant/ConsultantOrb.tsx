import { useEffect, useRef } from 'react'

/* ==========================================================================
   Consultant orb — a single-quad WebGL fragment shader (no three.js).
   A lit glass sphere filled with a slow domain-warped flow in the brand
   palette. `energy` (0–1) speeds and brightens the flow while the
   consultant is "speaking". DPR capped at 2, paused off-screen, one still
   frame for reduced motion, CSS fallback if WebGL is unavailable.
   ========================================================================== */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uEnergy;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);
  float r=length(uv);
  float R=.80;
  float z=sqrt(max(R*R-r*r,0.));
  vec3 nrm=normalize(vec3(uv,z+1e-4));
  float t=uTime*(.11+.16*uEnergy);
  // flow lives on the sphere surface: bend uv by the normal for curvature
  vec2 p=nrm.xy*(1.55+.25*nrm.z);
  vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,-t*.8)));
  vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*.6),fbm(p+3.*q+vec2(8.3,2.8)-t*.4));
  float f=fbm(p+2.6*w);
  vec3 deep=vec3(.010,.045,.022);
  vec3 lime=vec3(.776,1.,0.);
  vec3 cyan=vec3(.239,.91,1.);
  vec3 mint=vec3(.91,1.,.96);
  vec3 col=mix(deep*1.6,cyan*.92,smoothstep(.26,.6,f));
  col=mix(col,lime,smoothstep(.46,.84,f+.42*length(w-.5)));
  col+=mint*pow(smoothstep(.58,1.,f),2.)*.55;
  // inner emissive core so the sphere reads as light, not a dark marble
  col+=mix(lime,cyan,.5)*.22*smoothstep(.7,0.,r)*(.7+.3*uEnergy);
  // key light top-left, glass response
  vec3 L=normalize(vec3(-.55,.6,.65));
  col*=.58+.55*max(dot(nrm,L),0.);
  float spec=pow(max(dot(reflect(-L,nrm),vec3(0.,0.,1.)),0.),28.);
  col+=spec*.7*mint;
  float fres=pow(1.-nrm.z,2.6);
  col+=fres*mix(cyan,lime,.5+.5*sin(uTime*.25))*(.5+.45*uEnergy);
  float a=smoothstep(R,R-.012,r);
  float halo=smoothstep(1.,R,r)*(1.-a);
  halo*=halo*(.22+.4*uEnergy);
  vec3 hc=mix(cyan,lime,.45)*halo;
  gl_FragColor=vec4(col*a+hc,a+halo*.7);
}`

export default function ConsultantOrb({ energy, live, className = '' }: { energy: number; live: boolean; className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const target = useRef(energy)
  target.current = energy
  const fallback = useRef(false)

  useEffect(() => {
    const c = cv.current!
    const gl = c.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true })
    if (!gl) {
      fallback.current = true
      c.parentElement?.classList.add('orb--fallback')
      return
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      c.parentElement?.classList.add('orb--fallback')
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uEnergy = gl.getUniformLocation(prog, 'uEnergy')
    gl.clearColor(0, 0, 0, 0)

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.max(1, Math.round(c.clientWidth * dpr))
      const h = Math.max(1, Math.round(c.clientHeight * dpr))
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
      }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }
    let e = target.current
    const draw = (t: number) => {
      e += (target.current - e) * 0.06
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uTime, t)
      gl.uniform1f(uEnergy, e)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    fit()
    draw(4.2)
    const ro = new ResizeObserver(() => {
      fit()
      draw(4.2)
    })
    ro.observe(c)

    let raf = 0
    let visible = false
    const t0 = performance.now() - 4200
    const loop = () => {
      draw((performance.now() - t0) / 1000)
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      cancelAnimationFrame(raf)
      if (visible && live) raf = requestAnimationFrame(loop)
    })
    io.observe(c)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [live])

  return (
    <div className={`orb ${className}`} aria-hidden="true">
      <canvas ref={cv} className="orb__cv" />
    </div>
  )
}
