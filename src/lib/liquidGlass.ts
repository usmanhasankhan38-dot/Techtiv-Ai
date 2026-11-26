import gsap from 'gsap'

/**
 * Liquid Glass pointer response — one delegated listener for the whole page.
 * The surface under the pointer gets its specular pool moved to the pointer
 * (--mx/--my, set directly: no React, no re-render) and its reflection
 * strength (--lg-spec) eased up by GSAP; leaving eases it back to rest.
 * Surfaces that already track --mx/--my themselves keep doing so.
 * Disabled for coarse pointers and reduced motion.
 */
const SURFACES = [
  '.glass', '.glass-card', '.wf-card', '.wf__panel', '.tp', '.afc', '.af-strip', '.agb',
  '.af__card', '.af__tile', '.ax-panel', '.ax-strip', '.bp-stage', '.bv-card', '.cw',
  '.fq-card', '.hw-detail', '.pc', '.pd-card', '.nav__rail',
].join(',')

export function installLiquidGlass() {
  if (typeof window === 'undefined') return () => {}
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (!fine.matches || reduced.matches) return () => {}

  let current: HTMLElement | null = null
  let raf = 0
  let lx = 0
  let ly = 0

  const release = (el: HTMLElement) => {
    gsap.to(el, { '--lg-spec': 0.35, duration: 0.7, ease: 'power2.out', overwrite: 'auto' })
  }
  const frame = () => {
    raf = 0
    const el = current
    if (!el) return
    // .pc paints its glass on a child layer; the variable is inherited
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${(((lx - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(((ly - r.top) / r.height) * 100).toFixed(1)}%`)
  }
  const onMove = (e: PointerEvent) => {
    lx = e.clientX
    ly = e.clientY
    const t = e.target instanceof Element ? e.target.closest<HTMLElement>(SURFACES) : null
    if (t !== current) {
      if (current) release(current)
      current = t
      if (t) gsap.to(t, { '--lg-spec': 1, duration: 0.45, ease: 'power2.out', overwrite: 'auto' })
    }
    if (current && !raf) raf = requestAnimationFrame(frame)
  }
  const onLeave = () => {
    if (current) release(current)
    current = null
  }
  document.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  return () => {
    cancelAnimationFrame(raf)
    document.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
  }
}
