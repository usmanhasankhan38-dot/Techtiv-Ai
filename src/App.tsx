import { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Technology from './components/tech/Technology'
import Workflow from './components/workflow/Workflow'
import Assessment from './components/assessment/Assessment'
import Consultant from './components/consultant/Consultant'
import Agentic from './components/agentic/Agentic'
import Automation from './components/automation/Automation'
import Products from './components/products/Products'
import HowItWorks from './components/howitworks/HowItWorks'
import Blueprint from './components/blueprint/Blueprint'
import GlobeLayer from './components/GlobeLayer'
import Cursor from './components/Cursor'
import { initPointerTracking } from './lib/store'
import { hasWebGL, useFinePointer, useReducedMotion } from './lib/env'

export default function App() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const [webgl] = useState(() => hasWebGL())
  useEffect(() => initPointerTracking(), [])

  // keep every ScrollTrigger in sync with the real page height (fonts, panels and
  // canvases settle after first paint; stale positions can leave reveals unplayed)
  useEffect(() => {
    let t = 0
    const refresh = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    }
    const ro = new ResizeObserver(refresh)
    ro.observe(document.body)
    document.fonts?.ready.then(refresh)
    return () => {
      ro.disconnect()
      window.clearTimeout(t)
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#hero-title">Skip to content</a>
      <GlobeLayer webgl={webgl} />
      {fine && !reduced && <Cursor />}
      <Nav />
      <main>
        <Hero webgl={webgl} />
        <Technology webgl={webgl} />
        <Workflow />
        <Assessment />
        <Consultant />
        <Agentic />
        <Automation />
        <Products />
        <HowItWorks />
        <Blueprint />
      </main>
    </>
  )
}
