import { useEffect, useState } from 'react'

function useMedia(query: string) {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)')
export const useIsDesktop = () => useMedia('(min-width: 1100px)')

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** This build is a standalone hero preview: routes of the live site don't exist here. */
export const PREVIEW_MODE = true

let toastTimer = 0
export function previewNotice(label: string) {
  let el = document.querySelector<HTMLDivElement>('.preview-toast')
  if (!el) {
    el = document.createElement('div')
    el.className = 'preview-toast'
    el.setAttribute('role', 'status')
    document.body.appendChild(el)
  }
  el.textContent = `“${label}” links to a page outside this hero preview.`
  el.classList.add('is-on')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el?.classList.remove('is-on'), 2400)
}
