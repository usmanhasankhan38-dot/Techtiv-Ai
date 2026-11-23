import { useEffect, useRef, useState } from 'react'
import { QUERIES } from './productsData'
import { Ic } from './Ic'

/* 01 · The intelligent website — a miniature site with AI search.
   Deterministic: a chosen or typed query is matched to scripted results. */
type Phase = 'idle' | 'open' | 'typing' | 'thinking' | 'results' | 'nomatch'

export default function SiteDemo({ live, resetKey }: { live: boolean; resetKey: number }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [text, setText] = useState('')
  const [qi, setQi] = useState(-1)
  const timers = useRef<number[]>([])
  const input = useRef<HTMLInputElement>(null)
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clear, [])
  useEffect(() => {
    clear()
    setPhase('idle')
    setText('')
    setQi(-1)
  }, [resetKey])

  const answer = (i: number) => {
    setQi(i)
    if (!live) return setPhase(i < 0 ? 'nomatch' : 'results')
    setPhase('thinking')
    timers.current.push(window.setTimeout(() => setPhase(i < 0 ? 'nomatch' : 'results'), 650))
  }
  const pick = (i: number) => {
    clear()
    const q = QUERIES[i].q
    if (!live) {
      setText(q)
      return answer(i)
    }
    setPhase('typing')
    setText('')
    let n = 0
    const step = () => {
      n += 1
      setText(q.slice(0, n))
      if (n < q.length) timers.current.push(window.setTimeout(step, 22))
      else timers.current.push(window.setTimeout(() => answer(i), 160))
    }
    timers.current.push(window.setTimeout(step, 120))
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = text.trim().toLowerCase()
    if (!v) return
    clear()
    const i = QUERIES.findIndex((q) => q.keys.some((k) => v.includes(k)))
    answer(i)
  }

  const q = qi >= 0 ? QUERIES[qi] : null
  const showing = phase === 'results' && q
  return (
    <div className={`pw pw--${phase}`}>
      {/* browser chrome */}
      <div className="pw__bar" aria-hidden="true">
        <span className="pw__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="pw__url">
          <Ic n="lock" /> sample-co.com
        </span>
      </div>
      <div className="pw__site">
        <nav className="pw__nav" aria-hidden="true">
          <b>
            <span className="pw__logo" /> Sample Co.
          </b>
          <span>Services</span>
          <span>Work</span>
          <span>Pricing</span>
          <span className={`pw__navcta ${showing ? 'is-hot' : ''}`}>Contact</span>
        </nav>
        <div className="pw__hero">
          <p className="pw__kick">Studio for growing teams</p>
          <p className="pw__h">Ask anything about our services.</p>
        </div>

        <form className="pw__search" onSubmit={submit} role="search">
          <Ic n="spark" />
          <label className="sr-only" htmlFor="pw-q">
            Search the sample website
          </label>
          <input
            id="pw-q"
            ref={input}
            value={text}
            placeholder="Ask the site…"
            autoComplete="off"
            onFocus={() => phase === 'idle' && setPhase('open')}
            onChange={(e) => {
              clear()
              setText(e.target.value)
              setPhase('open')
            }}
          />
          <button type="submit" className="pw__go" aria-label="Search" disabled={!text.trim() || phase === 'typing' || phase === 'thinking'}>
            <Ic n="arrow" />
          </button>
        </form>

        <div className="pw__panel" aria-live="polite">
          {(phase === 'idle' || phase === 'open') && (
            <div className="pw__sugs">
              <p className="pw__k">Try a search</p>
              {QUERIES.map((x, i) => (
                <button key={x.q} type="button" className="pw__sug" onClick={() => pick(i)}>
                  <Ic n="search" /> {x.q}
                </button>
              ))}
              <p className="pw__k pw__k--rec">
                Recommended for you <em>from pages viewed · sample</em>
              </p>
              <div className="pw__recs" aria-hidden="true">
                <span>
                  <i />
                  <b>Automation audit</b>
                  <small>Free · 30 min</small>
                </span>
                <span>
                  <i />
                  <b>Website packages</b>
                  <small>Guide · 3 min</small>
                </span>
              </div>
            </div>
          )}
          {(phase === 'typing' || phase === 'thinking') && (
            <div className="pw__think">
              <span className="pw__bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {phase === 'typing' ? 'Reading your question…' : 'Matching pages and services…'}
            </div>
          )}
          {showing && (
            <div className="pw__res">
              <p className="pw__k">
                {q.answer} <em>sample results</em>
              </p>
              <ul>
                {q.results.map((r, i) => (
                  <li key={r.t} style={{ ['--i' as string]: i }} className={i === 0 ? 'is-top' : ''}>
                    <span className="pw__kind">{r.kind}</span>
                    <span className="pw__rt">
                      <b>{r.t}</b>
                      <small>{r.d}</small>
                    </span>
                    <span className="pw__match" aria-label={`${r.match}% match`}>
                      <i style={{ width: `${r.match}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pw__cta">
                <span>{q.cta}</span>
                <Ic n="arrow" />
              </div>
            </div>
          )}
          {phase === 'nomatch' && (
            <div className="pw__none">
              <p>No scripted answer for that one in this demo.</p>
              <button type="button" className="pw__sug" onClick={() => pick(0)}>
                <Ic n="search" /> {QUERIES[0].q}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
