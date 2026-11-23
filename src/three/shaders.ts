/* GLSL for the hero globe. Brand colours arrive as uniforms. */

const noise = /* glsl */ `
// Ashima / Stefan Gustavson simplex noise (MIT)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

/* ---------------- Land dots (with the liquid displacement) ---------------- */
export const landVertex = /* glsl */ `
${noise}
uniform float uTime;
uniform float uReveal;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3  uPointer;   // unit vector, globe-local
uniform vec3  uDrag;      // tangent drag direction, globe-local, length 0..1
uniform float uStrength;  // 0..1 velocity-driven, damped
uniform float uRadius;
attribute float aRand;
varying float vAlpha;
varying float vHot;
varying float vLift;

void main(){
  vec3 n = normalize(position);

  // ---- liquid response around the pointer ----
  float d = distance(n, uPointer);
  float fall = smoothstep(0.6, 0.0, d);                 // soft falloff, ~35° cap
  float k = fall * uStrength;
  float flow = snoise(n * 3.2 + vec3(0.0, uTime * 0.35, 0.0));
  // surface tangents for a viscous, swirling push (no ripples)
  vec3 ta = normalize(cross(n, vec3(0.0, 1.0, 0.0)) + 1e-4);
  vec3 tb = cross(n, ta);
  float sa = snoise(n * 4.5 + vec3(uTime * 0.55, 0.0, 0.0));
  float sb = snoise(n * 4.5 + vec3(17.0, uTime * 0.55, 0.0));
  vec3 swirl = (ta * sa + tb * sb) * k * 0.07;
  vec3 drag = uDrag * fall * k * 0.22;                  // dots pulled along the stroke
  float bulge = k * (0.06 + 0.07 * flow);
  vec3 p = position + (n * bulge + swirl + drag) * uRadius;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // dots fade toward the limb so the silhouette stays crisp
  vec3 vn = normalize(normalMatrix * n);
  float facing = clamp(vn.z, 0.0, 1.0);

  // cinematic light-up: sweep from the lit side (upper-left) across the globe
  vec3 lightDir = normalize(vec3(-0.65, 0.45, 0.6));
  float lit = dot(vn, lightDir) * 0.5 + 0.5;
  float reveal = smoothstep(lit - 0.25, lit, uReveal * 1.35 - 0.1);

  float hot = step(0.955, aRand);                          // ~4.5% bright nodes
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aRand * 2.4) + aRand * 40.0);
  vHot = hot * twinkle;
  vLift = k;
  vAlpha = reveal * (0.22 + 0.78 * smoothstep(0.02, 0.55, facing)) * (0.55 + 0.45 * lit);

  float size = uSize * (1.0 + hot * 0.9 + vLift * 1.6);
  gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);
}`

export const landFragment = /* glsl */ `
uniform vec3 uLand;
uniform vec3 uHot;
uniform vec3 uCyan;
varying float vAlpha;
varying float vHot;
varying float vLift;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float disc = smoothstep(0.5, 0.32, r);
  vec3 col = mix(uLand, uHot, clamp(vHot, 0.0, 1.0));
  col = mix(col, uCyan, clamp(vLift * 0.9, 0.0, 0.75));
  float a = disc * vAlpha * (0.62 + vHot * 0.38 + vLift * 0.4);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}`

/* ---------------- Core sphere: dark body, dot-matrix ocean, rim ---------------- */
export const coreVertex = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vObj;
void main(){
  vObj = normalize(position);
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

export const coreFragment = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uCyan;
uniform vec3 uLime;
uniform float uReveal;
varying vec3 vNormalV;
varying vec3 vObj;
void main(){
  vec3 lightDir = normalize(vec3(-0.65, 0.45, 0.6));
  float diff = clamp(dot(vNormalV, lightDir), 0.0, 1.0);
  float fres = pow(1.0 - clamp(vNormalV.z, 0.0, 1.0), 3.0);

  // faint dot matrix on the oceans (lat/long grid), fades at the poles
  float lat = asin(clamp(vObj.y, -1.0, 1.0));
  float lon = atan(vObj.x, vObj.z);
  vec2 g = vec2(lon * 48.0 / 3.14159265, lat * 48.0 / 3.14159265);
  vec2 cell = fract(g) - 0.5;
  float dotm = smoothstep(0.16, 0.05, length(cell)) * cos(lat) * 0.05;

  vec3 col = uBase * (0.55 + 0.9 * diff);
  col += mix(uCyan, uLime, smoothstep(-0.4, 0.8, vNormalV.y)) * fres * 0.42 * uReveal;
  col += vec3(dotm) * uReveal * (0.4 + diff);
  gl_FragColor = vec4(col, 1.0);
}`

/* ---------------- Atmosphere (back-face fresnel halo) ---------------- */
export const atmoVertex = /* glsl */ `
varying vec3 vNormalV;
void main(){
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
export const atmoFragment = /* glsl */ `
uniform vec3 uCyan;
uniform vec3 uLime;
uniform float uReveal;
varying vec3 vNormalV;
void main(){
  // back faces: brightest just outside the core silhouette, fading to zero at the halo edge
  float facing = clamp(-dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float i = pow(smoothstep(0.0, 0.62, facing), 2.4);
  vec3 col = mix(uCyan, uLime, smoothstep(-0.7, 0.9, vNormalV.y - vNormalV.x * 0.35));
  gl_FragColor = vec4(col, i * 0.5 * uReveal);
}`

/* ---------------- Orbit ring (thin tube) with travelling comet ---------------- */
export const ringVertex = /* glsl */ `
varying float vT;
varying float vDepth;
void main(){
  vT = uv.x;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = mv.z;
  gl_Position = projectionMatrix * mv;
}`
export const ringFragment = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uPhase;
uniform float uDraw;
uniform float uOpacity;
uniform vec3 uCyan;
uniform vec3 uLime;
varying float vT;
void main(){
  float head = fract(uTime * uSpeed + uPhase);
  float behind = fract(head - vT);                 // 0 at the head, grows along the tail
  float comet = exp(-behind * 9.0);
  float drawn = step(vT, uDraw);
  vec3 col = mix(uCyan, uLime, vT);
  float a = (0.13 + 0.87 * comet) * drawn * uOpacity;
  gl_FragColor = vec4(col * (0.7 + comet * 0.8), a);
}`

/* ---------------- Particles that ride the orbits ---------------- */
export const orbitPointVertex = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uRadiusOrbit;
uniform float uPixelRatio;
uniform float uDraw;
attribute float aPhase;
attribute float aSize;
varying float vFade;
void main(){
  float t = fract(aPhase + uTime * uSpeed);
  float ang = t * 6.28318530718;
  vec3 p = vec3(cos(ang) * uRadiusOrbit, sin(ang) * uRadiusOrbit, 0.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vFade = step(t, uDraw);
  gl_PointSize = aSize * uPixelRatio * (8.0 / -mv.z);
}`
export const orbitPointFragment = /* glsl */ `
uniform vec3 uColor;
varying float vFade;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, r);
  float a = pow(core, 2.2) * vFade;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}`

/* ---------------- Atmospheric field behind the globe (liquid warp) ---------------- */
export const fieldVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
export const fieldFragment = /* glsl */ `
${noise}
uniform float uTime;
uniform vec2  uPointerUv;
uniform vec2  uVel;
uniform float uStrength;
uniform float uReveal;
uniform vec3  uCyan;
uniform vec3  uLime;
varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  // liquid push: pixels near the pointer are displaced along its motion
  vec2 dp = uv - uPointerUv;
  float fall = exp(-dot(dp, dp) * 26.0);
  uv -= uVel * fall * uStrength * 0.16;
  uv += normalize(dp + 1e-4) * fall * uStrength * 0.025;

  vec2 c = uv - 0.5;
  float rad = length(c);
  float n1 = snoise(vec3(uv * 2.4, uTime * 0.05));
  float n2 = snoise(vec3(uv * 5.0 + n1 * 0.6, uTime * 0.08));
  float glow = smoothstep(0.5, 0.12, rad);
  float veil = glow * (0.55 + 0.45 * n1) * (0.75 + 0.25 * n2);
  vec3 col = mix(uCyan, uLime, smoothstep(-0.3, 0.6, c.x + n2 * 0.2));
  float a = veil * 0.085 * uReveal + fall * uStrength * 0.04 * uReveal;
  gl_FragColor = vec4(col, a);
}`
