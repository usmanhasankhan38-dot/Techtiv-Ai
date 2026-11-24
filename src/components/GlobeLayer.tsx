import { lazy, Suspense, useEffect, useState } from 'react'
import { useIsDesktop, useReducedMotion } from '../lib/env'
import './globe-layer.css'

/* V2: the shared fixed layer now hosts the forged intelligence core. */
const CoreScene = lazy(() => import('../three/core/CoreScene'))

/** Static stand-in (no WebGL / lost context): a CSS-lit metal ring, same silhouette. */
export function GlobeFallback() {
  return (
    <div className="core-fallback" aria-hidden="true">
      <span className="core-fallback__ring" />
      <span className="core-fallback__inner" />
    </div>
  )
}

/**
 * One fixed, full-viewport WebGL layer shared by the Hero and Technology
 * sections. The core inside follows whichever section anchor is active, so
 * one scene (and one render loop) carries the story between the sections.
 */
export default function GlobeLayer({ webgl }: { webgl: boolean }) {
  const reduced = useReducedMotion()
  const desktop = useIsDesktop()
  const [active, setActive] = useState(true)
  const [lost, setLost] = useState(false)

  // render only while the hero or technology section is on screen
  useEffect(() => {
    const els = ['.hero', '#technology'].map((s) => document.querySelector(s)).filter(Boolean) as Element[]
    const seen = new Map<Element, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target, e.isIntersecting))
        setActive([...seen.values()].some(Boolean))
      },
      { rootMargin: '200px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // a lost GPU context falls back to the static ring in the hero
  useEffect(() => {
    document.documentElement.classList.toggle('core-lost', lost)
  }, [lost])

  return (
    <>
      <div className="page-backdrop" aria-hidden="true" />
      {webgl && !lost && (
        <div className={`globe-layer ${active ? '' : 'is-idle'}`} aria-hidden="true">
          <Suspense fallback={null}>
            <CoreScene layout={desktop ? 'desktop' : 'compact'} reducedMotion={reduced} active={active} onLost={() => setLost(true)} />
          </Suspense>
        </div>
      )}
    </>
  )
}
