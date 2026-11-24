/**
 * V2 motion tokens — one vocabulary for every GSAP timeline on the site.
 * CSS twins live in styles/v2.css (--v-d-*, --v-ease-*).
 */
export const DUR = {
  micro: 0.18, // hovers, presses
  ui: 0.36, // state changes
  reveal: 0.9, // text / element reveals
  hero: 1.3, // display type, large objects
  scene: 2.2, // 3D emergence, lighting
} as const

export const EASE = {
  reveal: 'expo.out', // masked type, hairlines
  enter: 'power3.out', // supporting UI
  scene: 'power2.inOut', // camera, lighting, 3D state
  exit: 'power2.in',
  none: 'none', // scrubbed timelines
} as const

export const STAGGER = { tight: 0.04, base: 0.08, loose: 0.14 } as const

/** scrub smoothing (seconds of lag) — heavier objects lag more */
export const SCRUB = { ui: 0.6, type: 0.8, scene: 1.1 } as const

/** pointer response strength — subtle by default */
export const POINTER = { tiltDeg: 7, parallaxPx: 18, magnet: 0.28 } as const
