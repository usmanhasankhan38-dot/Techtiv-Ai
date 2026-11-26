import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { onTheme } from '../lib/theme'

/** On-demand canvases (reduced motion, degraded devices) don't run a loop;
 *  this keeps them rendering for the length of a theme tween so materials
 *  still follow the switch. Continuous canvases are unaffected. */
export default function ThemeInvalidate() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(
    () =>
      onTheme(() => {
        const until = performance.now() + 900
        const tick = () => {
          invalidate()
          if (performance.now() < until) requestAnimationFrame(tick)
        }
        tick()
      }),
    [invalidate],
  )
  return null
}
