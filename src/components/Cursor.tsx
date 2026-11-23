import { useEffect, useRef } from 'react'
import { pointer, sceneState } from '../lib/store'
import './cursor.css'

/**
 * Dot + velocity-stretched ring. Purely visual (pointer-events: none): clicks,
 * hover and focus still go to the real elements underneath.
 * Mounted only for fine pointers with motion allowed.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add('has-custom-cursor')
    let raf = 0
    let rx = pointer.x
    let ry = pointer.y
    let scale = 1
    let magnet: HTMLElement | null = null

    const releaseMagnet = () => {
      if (magnet) {
        magnet.style.transform = ''
        magnet = null
      }
    }

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      const m = t.closest<HTMLElement>('[data-magnetic]')
      if (m !== magnet) releaseMagnet()
      magnet = m
      const interactive = !!t.closest('a, button, [role="button"]')
      ring.current?.classList.toggle('is-link', interactive)
      ring.current?.classList.toggle('is-card', !!t.closest('.glass-card'))
    }
    const onDown = () => ring.current?.classList.add('is-down')
    const onUp = () => ring.current?.classList.remove('is-down')

    const tick = () => {
      const visible = pointer.inside && pointer.x > -9000
      if (visible && rx < -9000) {
        rx = pointer.x
        ry = pointer.y
      }
      dot.current!.style.opacity = visible ? '1' : '0'
      ring.current!.style.opacity = visible ? '1' : '0'

      // dot follows exactly; ring trails with critically damped easing
      rx += (pointer.x - rx) * 0.2
      ry += (pointer.y - ry) * 0.2

      // magnetic pull: element drifts toward the pointer, ring snaps to its centre
      let tx = rx
      let ty = ry
      if (magnet) {
        const r = magnet.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = pointer.x - cx
        const dy = pointer.y - cy
        magnet.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.3}px, 0)`
        tx = cx + dx * 0.35
        ty = cy + dy * 0.35
        rx += (tx - rx) * 0.15
        ry += (ty - ry) * 0.15
      }

      const speed = Math.min(pointer.speed, 3)
      const angle = Math.atan2(pointer.vy, pointer.vx)
      const stretch = 1 + speed * 0.22
      const targetScale = sceneState.pointerOnGlobe && !magnet ? 1.9 : 1
      scale += (targetScale - scale) * 0.12
      ring.current!.classList.toggle('is-globe', sceneState.pointerOnGlobe && !magnet)

      dot.current!.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`
      ring.current!.style.transform =
        `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) rotate(${angle}rad) ` +
        `scale(${(stretch * scale).toFixed(3)}, ${((1 / Math.sqrt(stretch)) * scale).toFixed(3)})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      releaseMagnet()
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
