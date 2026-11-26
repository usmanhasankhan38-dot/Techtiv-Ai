/**
 * Tiny shared, mutable state read inside animation loops.
 * Kept outside React on purpose: per-frame values must never trigger re-renders.
 */

export const pointer = {
  x: -9999, // client px
  y: -9999,
  vx: 0, // smoothed velocity, px per ms
  vy: 0,
  speed: 0,
  inside: false,
  lastT: 0,
}

/** Values GSAP tweens (intro + scroll) and the WebGL scene reads every frame. */
export const sceneMotion = {
  reveal: 0, // globe light-up 0 → 1
  orbits: 0, // orbit draw-on 0 → 1
  handoff: 0, // hero → technology globe transition 0 → 1 (scroll-scrubbed)
  zoom: 0, // whole hero → technology journey 0 → 1; drives the push-in / pull-out
}

/**
 * DOM elements the single shared globe follows. Each section owns a sized,
 * invisible anchor; the globe interpolates between them while scrolling, so
 * there is one WebGL scene and one render loop for the whole page.
 */
export const globeAnchors = {
  hero: null as HTMLElement | null,
  tech: null as HTMLElement | null,
}

/** Set by the WebGL scene, read by the cursor. */
export const sceneState = {
  pointerOnGlobe: false,
  liquid: 0, // current liquid strength (for QA via #debug)
  forceLiquid: null as number | null, // QA override only
}

export function initPointerTracking() {
  const onMove = (e: PointerEvent) => {
    const now = performance.now()
    const dt = Math.max(8, now - (pointer.lastT || now - 16))
    const ivx = (e.clientX - pointer.x) / dt
    const ivy = (e.clientY - pointer.y) / dt
    if (pointer.x > -9000) {
      // exponential smoothing keeps velocity stable on high-rate mice
      pointer.vx += (ivx - pointer.vx) * 0.35
      pointer.vy += (ivy - pointer.vy) * 0.35
    }
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.lastT = now
    pointer.inside = true
  }
  const onLeave = () => {
    pointer.inside = false
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  // velocity decays when the mouse stops moving
  let raf = 0
  const decay = () => {
    pointer.vx *= 0.9
    pointer.vy *= 0.9
    pointer.speed = Math.hypot(pointer.vx, pointer.vy)
    raf = requestAnimationFrame(decay)
  }
  raf = requestAnimationFrame(decay)

  return () => {
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    cancelAnimationFrame(raf)
  }
}

/**
 * V3 Technology explorer — shared, mutable interaction state between the
 * Technology section (DOM, GSAP) and the globe scene (WebGL). Per-frame values
 * live here so pointer movement never re-renders React.
 *   UI → scene : overGlobe, mouse, dragging, dragDX/dragDY, focusReq, pick
 *   scene → UI : enabled, hover, sx/sy/facing (active hotspot), cx/cy/rpx (globe)
 */
export const techGlobe = {
  count: 0,
  enabled: false, // the globe has settled in Technology and accepts interaction
  intro: 0, // 0–1 hotspot stagger-in (GSAP)
  mouse: true, // last pointer was a mouse (hover allowed)
  overGlobe: false,
  dragging: false,
  dragDX: 0,
  dragDY: 0,
  hover: -1, // hotspot under the mouse (scene)
  active: -1, // hotspot whose popup is open (UI)
  focusReq: -1, // UI asks the scene to turn a hotspot to the front
  pick: { x: 0, y: 0, id: 0 }, // tap / click pick request (UI)
  pickAns: { id: 0, idx: -1 }, // answer (scene)
  sx: 0, // active hotspot, screen px
  sy: 0,
  facing: 0,
  cx: 0, // globe centre + radius, screen px
  cy: 0,
  rpx: 0,
  invalidate: null as null | (() => void), // demand-mode redraw (reduced motion)
}

if (typeof window !== 'undefined' && window.location.hash === '#debug') {
  ;(window as unknown as Record<string, unknown>).__hero = { pointer, sceneState, sceneMotion, techGlobe }
}
