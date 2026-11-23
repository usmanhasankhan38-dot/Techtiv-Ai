import { useEffect, useRef, useState } from 'react'
import { PROMPTS, RECS, REPLIES, SERVICES_M, SLOTS, type Prompt } from './productsData'
import { Ic } from './Ic'

/* 03 · The AI mobile companion — a phone viewport built from components.
   Scripted assistant: prompts → typing → reply → follow-up choices. */
type Tab = 'home' | 'chat' | 'bookings'
type Msg = { id: number; who: 'me' | 'ai'; t: string; kind?: Prompt | 'confirm' }

export default function MobileDemo({ live, resetKey }: { live: boolean; resetKey: number }) {
  const [tab, setTab] = useState<Tab>('home')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [booked, setBooked] = useState<string | null>(null)
  const [seen, setSeen] = useState(true)
  const timers = useRef<number[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const id = useRef(0)
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clear, [])
  useEffect(() => {
    clear()
    setTab('home')
    setMsgs([])
    setTyping(false)
    setBooked(null)
    setSeen(true)
  }, [resetKey])
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: live ? 'smooth' : 'auto' })
  }, [msgs, typing, live])

  const say = (me: string, reply: string, kind?: Msg['kind']) => {
    clear()
    setTab('chat')
    setMsgs((m) => [...m, { id: ++id.current, who: 'me', t: me }])
    if (!live) return setMsgs((m) => [...m, { id: ++id.current, who: 'ai', t: reply, kind }])
    setTyping(true)
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false)
        setMsgs((m) => [...m, { id: ++id.current, who: 'ai', t: reply, kind }])
      }, 900),
    )
  }
  const ask = (p: Prompt) => say(PROMPTS.find((x) => x.id === p)!.t, REPLIES[p], p)
  const book = (slot: string) => {
    setBooked(slot)
    setSeen(false)
    say(slot, `Booked — ${slot} with a product lead. It’s in your Bookings tab. (Demo only: no calendar was changed.)`, 'confirm')
  }
  const busy = typing

  return (
    <div className="pm">
      <div className="pm__phone">
        <div className="pm__status" aria-hidden="true">
          <span>9:41</span>
          <i className="pm__island" />
          <span className="pm__sig">
            <i />
            <i />
            <i />
          </span>
        </div>

        <div className="pm__screen" ref={scroller}>
          {tab === 'home' && (
            <div className="pm-home" key="home">
              <div className="pm-head">
                <div>
                  <small>Good morning</small>
                  <b>Sam</b>
                </div>
                <span className="pm-av" aria-hidden="true">
                  S
                </span>
              </div>
              <div className="pm-assist">
                <p className="pm-assist__k">
                  <Ic n="spark" s={14} /> Assistant
                </p>
                <p className="pm-assist__t">What can I help you with today?</p>
                <div className="pm-chips">
                  {PROMPTS.map((p) => (
                    <button key={p.id} type="button" className="pm-chip" onClick={() => ask(p.id)} disabled={busy}>
                      {p.t}
                    </button>
                  ))}
                </div>
                <span className="pm-assist__mic" aria-hidden="true">
                  <Ic n="mic" s={14} /> Voice
                </span>
              </div>
              <p className="pm-sec">For you</p>
              {RECS.map((r) => (
                <div key={r.t} className="pm-rec">
                  <span className="pm-rec__ic" aria-hidden="true">
                    <Ic n="bulb" s={15} />
                  </span>
                  <span>
                    <b>{r.t}</b>
                    <small>{r.d}</small>
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'chat' && (
            <div className="pm-chat" key="chat" aria-live="polite">
              {msgs.length === 0 && <p className="pm-empty">Ask the assistant something to start.</p>}
              {msgs.map((m, i) => {
                const lastAi = m.who === 'ai' && i === msgs.length - 1
                return (
                  <div key={m.id} className={`pm-msg pm-msg--${m.who}`}>
                    <p>{m.t}</p>
                    {lastAi && m.kind === 'find' && (
                      <div className="pm-opts">
                        {SERVICES_M.map((s) => (
                          <button key={s} type="button" className="pm-chip" disabled={busy} onClick={() => say(s, `${s}: we scope it with you in a short call, then build in sprints. Want to book one?`, 'schedule')}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {lastAi && m.kind === 'schedule' && (
                      <div className="pm-opts">
                        {SLOTS.map((s) => (
                          <button key={s} type="button" className="pm-chip pm-chip--slot" disabled={busy} onClick={() => book(s)}>
                            <Ic n="cal" s={13} /> {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {lastAi && m.kind === 'recommend' && (
                      <div className="pm-cards">
                        {RECS.map((r) => (
                          <div key={r.t} className="pm-rec pm-rec--sm">
                            <span className="pm-rec__ic" aria-hidden="true">
                              <Ic n="bulb" s={14} />
                            </span>
                            <span>
                              <b>{r.t}</b>
                              <small>{r.d}</small>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {typing && (
                <div className="pm-msg pm-msg--ai pm-typing" aria-label="Assistant is typing">
                  <i />
                  <i />
                  <i />
                </div>
              )}
              {!typing && msgs.length > 0 && (
                <div className="pm-follow">
                  {PROMPTS.map((p) => (
                    <button key={p.id} type="button" className="pm-chip pm-chip--ghost" onClick={() => ask(p.id)}>
                      {p.t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'bookings' && (
            <div className="pm-book" key="bookings">
              <p className="pm-sec">Bookings</p>
              {booked ? (
                <div className="pm-slot">
                  <span className="pm-rec__ic" aria-hidden="true">
                    <Ic n="cal" s={15} />
                  </span>
                  <span>
                    <b>Consultation · {booked}</b>
                    <small>30 min · product lead · demo booking</small>
                  </span>
                </div>
              ) : (
                <div className="pm-emptybox">
                  <p>No bookings yet.</p>
                  <button type="button" className="pm-chip" onClick={() => ask('schedule')}>
                    Schedule a consultation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="pm__nav" aria-label="App navigation">
          {(
            [
              ['home', 'Home', 'home'],
              ['chat', 'Assistant', 'chat'],
              ['bookings', 'Bookings', 'cal'],
            ] as const
          ).map(([k, t, ic]) => (
            <button
              key={k}
              type="button"
              aria-current={tab === k ? 'page' : undefined}
              className={tab === k ? 'is-on' : ''}
              onClick={() => {
                setTab(k)
                if (k === 'bookings') setSeen(true)
              }}
            >
              <Ic n={ic} s={18} />
              <span>{t}</span>
              {k === 'bookings' && !seen && <i className="pm__badge" aria-label="new booking" />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
