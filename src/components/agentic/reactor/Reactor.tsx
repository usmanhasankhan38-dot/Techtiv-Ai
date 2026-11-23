import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactorState } from './ReactorScene'
import { hasWebGL } from '../../../lib/env'

/* Phase 1 — AgentForce Intelligence Reactor (React Three Fiber).
   Same footprint and props as the previous core, so the connectors, modules
   and layout are untouched. Loaded lazily into the same chunk as the globe
   scene (three + fiber are already there). */
const ReactorScene = lazy(() => import('./ReactorScene'))

export default function Reactor({ focus, live, pulseKey = 0, className = '' }: { focus: number; live: boolean; pulseKey?: number; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const s = useRef<ReactorState>({ focus, px: 0, py: 0, hover: 0, pulse: 0, time: 6 })
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
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={() => live && (s.current.pulse = 1)}
    >
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
