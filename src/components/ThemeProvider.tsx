import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, readInitialTheme, type ThemeMode } from '../lib/theme'

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; toggle: () => void }
const ThemeCtx = createContext<Ctx>({ mode: 'dark', setMode: () => {}, toggle: () => {} })

/** Root theme provider: one state, applied to <html> (CSS tokens) and the WebGL store. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialTheme)
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    applyTheme(m, true)
  }, [])
  const toggle = useCallback(() => setMode(mode === 'light' ? 'dark' : 'light'), [mode, setMode])
  // first paint already has the right attribute (inline script); keep store + storage in step
  useEffect(() => {
    applyTheme(mode, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
