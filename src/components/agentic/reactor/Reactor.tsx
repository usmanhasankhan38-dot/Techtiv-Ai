import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { ReactorState } from './GeodesicCore'
import { hasWebGL } from '../../../lib/env'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* V3 — AgentForce core: geodesic intelligence sphere (React Three Fiber).
   Same footprint and props as the previous reactor; loaded lazily. */
const ReactorScene = lazy(() => import('./GeodesicCore'))
// no-WebGL still: loaded only when needed, so three.js stays out of the main bundle
const StaticCore = lazy(() => import('./StaticCore'))

export default function Reactor({ focus, live, pulseKey = 0, className = '' }: { focus: number; live: boolean; pulseKey?: number; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const s = useRef<ReactorState>({ focus, px: 0, py: 0, hover: 0, pulse: 0, time: 6, enter: live ? 0 : 1, scroll: 0 })
  s.current.focus = focus
  const [inView, setInView] = useState(false)
  // Stage 02 sync: each new agent selection fires the reactor's existing pulse
  useEffect(() => {
    if (pulseKey && live) s.current.pulse = 1
  }, [pulseKey, live])
  const [webgl] = useState(() => hasWebGL())

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '120px' })
    io.observe(wrap.current!)
    return () => io.disconnect()
  }, [])

  /* GSAP: the cages assemble the first time the core is seen, and the camera
     arcs over the sphere as the hero scrolls away (scrubbed, reversible) */
  const entered = useRef(false)
  useEffect(() => {
    if (!inView || entered.current) return
    entered.current = true
    if (!live) {
      s.current.enter = 1
      return
    }
    gsap.to(s.current, { enter: 1, duration: 2.6, delay: 0.35, ease: 'power2.inOut' })
  }, [inView, live])
  useGSAP(
    () => {
      if (!live) return
      ScrollTrigger.create({
        trigger: wrap.current,
        start: 'center 55%',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          s.current.scroll = self.progress
        },
      })
    },
    { scope: wrap, dependencies: [live] },
  )

  const onMove = (e: React.PointerEvent) => {
    if (!live) return
    const r = wrap.current!.getBoundingClientRect()
    s.current.px = ((e.clientX - r.left) / r.width) * 2 - 1
    s.current.py = ((e.clientY - r.top) / r.height) * 2 - 1
    s.current.hover = 1
  }
  const onLeave = () => {
    s.current.px = 0
    s.current.py = 0
    s.current.hover = 0
  }

  // never render the scene until it is near the screen; pause it when it leaves
  const frameloop = !live ? 'demand' : inView ? 'always' : 'never'
  return (
    <div
      ref={wrap}
      className={`core reactor ${webgl ? '' : 'core--fallback'} ${className}`}
      aria-hidden="true"
      data-cursor="reactor"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={() => live && (s.current.pulse = 1)}
    >
      {!webgl && (
        <Suspense fallback={null}>
          <StaticCore />
        </Suspense>
      )}
      {webgl && (inView || !live) && (
        <Suspense fallback={null}>
          <ReactorScene
            s={s}
            frameloop={frameloop}
            onReady={(gl) => {
              if (location.hash.includes('debug')) (window as unknown as { __reactor: unknown }).__reactor = { gl, s }
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
