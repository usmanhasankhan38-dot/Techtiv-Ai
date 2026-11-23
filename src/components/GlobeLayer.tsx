import { lazy, Suspense, useEffect, useState } from 'react'
import { useIsDesktop, useReducedMotion } from '../lib/env'
import './globe-layer.css'

const GlobeScene = lazy(() => import('../three/GlobeScene'))

export function GlobeFallback() {
  return <div className="globe-fallback" aria-hidden="true" />
}

/**
 * One fixed, full-viewport WebGL layer shared by the Hero and Technology
 * sections. The globe inside follows whichever section anchor is active, so
 * the same scene (same rotation, same orbits) travels between sections.
 */
export default function GlobeLayer({ webgl }: { webgl: boolean }) {
  const reduced = useReducedMotion()
  const desktop = useIsDesktop()
  const [active, setActive] = useState(true)

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

  return (
    <>
      <div className="page-backdrop" aria-hidden="true" />
      {webgl && (
        <div className={`globe-layer ${active ? '' : 'is-idle'}`} aria-hidden="true">
          <Suspense fallback={null}>
            <GlobeScene layout={desktop ? 'desktop' : 'compact'} reducedMotion={reduced} active={active} />
          </Suspense>
        </div>
      )}
    </>
  )
}
