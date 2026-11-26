import gsap from 'gsap'

/**
 * V3 global theme state.
 *  - `mode` is the source of truth; it lives on <html data-theme> (CSS tokens
 *    switch from there) and in localStorage.
 *  - `t` is a 0 (dark) → 1 (light) value tweened by GSAP; every WebGL scene
 *    reads it each frame and eases its materials/lighting — scenes never remount.
 */
export type ThemeMode = 'dark' | 'light'
export const THEME_KEY = 'techtivai-theme'

export const themeState = {
  mode: 'dark' as ThemeMode,
  t: 0,
}

const listeners = new Set<(m: ThemeMode) => void>()
export function onTheme(fn: (m: ThemeMode) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function readInitialTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark'
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'light' ? 'light' : 'dark' // dark is the default for first visits
}

let animT = 0
export function applyTheme(mode: ThemeMode, animate = true) {
  const root = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  themeState.mode = mode
  // one class turns on colour transitions for the switch only (never during scroll/hover)
  if (animate && !reduced) {
    root.classList.add('theme-anim')
    window.clearTimeout(animT)
    animT = window.setTimeout(() => root.classList.remove('theme-anim'), 760)
  }
  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* storage unavailable: the choice still applies for this visit */
  }
  const target = mode === 'light' ? 1 : 0
  gsap.killTweensOf(themeState)
  if (animate && !reduced) gsap.to(themeState, { t: target, duration: 0.7, ease: 'power2.inOut' })
  else themeState.t = target
  listeners.forEach((fn) => fn(mode))
}

// sync the store with what the inline <head> script already applied
if (typeof document !== 'undefined') {
  themeState.mode = readInitialTheme()
  themeState.t = themeState.mode === 'light' ? 1 : 0
}
