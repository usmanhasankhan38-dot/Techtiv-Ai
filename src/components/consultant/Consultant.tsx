import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import ConsultantOrb from './ConsultantOrb'
import { FALLBACK, matchTopic, TOPICS, VOICE_SCRIPT, type Reply, type Topic } from './consultantData'
import { Glyph } from '../glyphs'
import { PREVIEW_MODE, useReducedMotion } from '../../lib/env'
import './consultant.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Live "Talk to AI Consultant" goes to /analyze (the consultant needs the
   production backend). This standalone preview opens the live flow. */
const CONSULT_URL = PREVIEW_MODE ? 'https://techtivai.vercel.app/analyze' : '/analyze'

type Msg = { id: number; from: 'ai' | 'user' | 'note'; text: string; adds?: string[] }
type View = 'home' | 'chat' | 'voice'

const BULLETS = [
  'Understands your business profile and assessment answers',
  'Asks only what matters — grounded in your real website and socials',
  'Recommends tools and TechTivAI services tied to your problems',
  'Text chat and real-time voice after your blueprint',
]

/* small interface icons for the window chrome (1.5px, 24 grid) */
const I = {
  chat: <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h0a2 2 0 0 1-2-2Z" />,
  voice: <path d="M4 12h1.5M8 8v8M12 5v14M16 8.5v7M19.5 11v2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5" />
    </>
  ),
  send: <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" />,
  end: <path d="M4.5 14.5c4.5-4 10.5-4 15 0l-2 2.3-3-1.3v-2.2a10 10 0 0 0-5 0v2.2l-3 1.3Z" />,
  replay: <path d="M5 12a7 7 0 1 0 2.1-5M5 4.5V8h3.5" />,
}
const Ico = ({ d, s = 16 }: { d: React.ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

let uid = 0

export default function Consultant() {
  const root = useRef<HTMLElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion()
  const live = !reduced

  const [view, setView] = useState<View>('home')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [replies, setReplies] = useState<Reply[] | null>(null)
  const [nextTopics, setNextTopics] = useState<Topic[] | null>(null)
  const [input, setInput] = useState('')
  const [voiceStep, setVoiceStep] = useState(-1)
  const [voiceDone, setVoiceDone] = useState(false)

  const timers = useRef<number[]>([])
  const demoTimers = useRef<number[]>([])
  const interacted = useRef(false)
  const used = useRef<Set<string>>(new Set())

  const later = (fn: () => void, ms: number, bucket = timers) => {
    bucket.current.push(window.setTimeout(fn, reduced ? Math.min(ms, 60) : ms))
  }
  const clear = (bucket = timers) => {
    bucket.current.forEach((t) => window.clearTimeout(t))
    bucket.current = []
  }
  useEffect(
    () => () => {
      clear()
      clear(demoTimers)
    },
    [],
  )

  // keep the newest message in view, inside the window only (never the page)
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [msgs, typing, replies, nextTopics, reduced])

  const push = (m: Omit<Msg, 'id'>) => setMsgs((list) => [...list, { ...m, id: ++uid }])

  const aiSay = useCallback(
    (text: string, then?: () => void, extra?: Partial<Msg>) => {
      setTyping(true)
      later(() => {
        setTyping(false)
        push({ from: 'ai', text, ...extra })
        then?.()
      }, 950 + Math.min(text.length * 9, 900))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  )

  const startTopic = (text: string, topic: Topic | null) => {
    setView('chat')
    setReplies(null)
    setNextTopics(null)
    push({ from: 'user', text })
    if (topic) {
      used.current.add(topic.id)
      aiSay(topic.question, () => setReplies(topic.replies))
    } else {
      aiSay(FALLBACK, () => setNextTopics(TOPICS))
    }
  }

  const pickReply = (r: Reply) => {
    setReplies(null)
    push({ from: 'user', text: r.label })
    aiSay(r.answer, () => {
      later(() => {
        push({ from: 'note', text: 'Added to your blueprint', adds: r.adds })
        const rest = TOPICS.filter((t) => !used.current.has(t.id))
        setNextTopics(rest.length ? rest : null)
      }, 380)
    })
  }

  const demoTyping = useRef(false)
  const userAct = () => {
    if (interacted.current) return
    interacted.current = true
    clear(demoTimers)
    if (demoTyping.current) {
      demoTyping.current = false
      setInput('')
    }
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    userAct()
    const text = input.trim()
    if (!text || typing) return
    setInput('')
    startTopic(text, matchTopic(text))
  }

  const newChat = () => {
    userAct()
    clear()
    setTyping(false)
    setMsgs([])
    setReplies(null)
    setNextTopics(null)
    used.current.clear()
    setView('home')
    setVoiceStep(-1)
  }

  // ---- voice preview: captions only, no audio, no microphone ----
  const runVoice = () => {
    clear()
    setTyping(false)
    setVoiceDone(false)
    setVoiceStep(0)
    let at = 500
    VOICE_SCRIPT.forEach((line, i) => {
      later(() => setVoiceStep(i), at)
      at += line.ms
    })
    later(() => setVoiceDone(true), at)
  }
  const openVoice = () => {
    userAct()
    setView('voice')
    runVoice()
  }
  const endVoice = () => {
    clear()
    setVoiceStep(-1)
    setView(msgs.length ? 'chat' : 'home')
  }

  // ---- one-time guided demo when the window first comes into view ----
  useEffect(() => {
    if (reduced) return
    const el = root.current!.querySelector('.cw')!
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || interacted.current) return
        io.disconnect()
        const topic = TOPICS[0]
        let at = 1400
        for (let i = 1; i <= topic.prompt.length; i++) {
          const s = topic.prompt.slice(0, i)
          later(
            () => {
              if (interacted.current) return
              demoTyping.current = true
              setInput(s)
            },
            at,
            demoTimers,
          )
          at += 38
        }
        later(
          () => {
            if (interacted.current) return
            demoTyping.current = false
            setInput('')
            startTopic(topic.prompt, topic)
          },
          at + 500,
          demoTimers,
        )
        later(() => !interacted.current && pickReply(topic.replies[0]), at + 500 + 2300 + 2600, demoTimers)
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  // ---- entrance choreography ----
  useGSAP(
    () => {
      if (reduced) return
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 68%' }, defaults: { ease: 'power3.out' } })
      tl.from(q('.ac__eyebrow'), { y: 14, opacity: 0, duration: 0.7 })
        .from(q('.ac__line > span'), { yPercent: 115, rotate: 2, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .from(q('.ac__desc'), { y: 16, opacity: 0, duration: 0.8 }, 0.45)
        .from(q('.ac__list li'), { x: -12, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.6)
        .from(q('.ac__cta'), { y: 12, opacity: 0, duration: 0.6 }, 0.95)
        .from(q('.cw'), { y: 50, opacity: 0, scale: 0.97, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.25)
        .from(q('.cw__orb'), { scale: 0.6, opacity: 0, duration: 1.4, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.6)
    },
    { scope: root, dependencies: [reduced] },
  )

  // idle CSS motion rests off-screen
  useEffect(() => {
    const el = root.current!
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-offscreen', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const voiceLine = voiceStep >= 0 ? VOICE_SCRIPT[voiceStep] : null
  const energy = view === 'voice' ? (voiceLine && !voiceDone ? (voiceLine.who === 'ai' ? 0.95 : 0.35) : 0.2) : typing ? 0.7 : 0.25

  return (
    <section ref={root} id="ai-consultant" className="ac" aria-labelledby="ac-title">
      <div className="ac__inner">
        <div className="ac__copy">
          <p className="ac__eyebrow">
            <span className="ac__eyebrow-dot" aria-hidden="true" />
            AI Consultant
          </p>
          <h2 id="ac-title" className="ac__title">
            <span className="ac__line">
              <span>Chat with an AI consultant</span>
            </span>
            <span className="ac__line ac__line--accent">
              <span>that knows your business</span>
            </span>
          </h2>
          <p className="ac__desc">
            After you share your footprint, the consultant uses your profile, assessment answers, tools, and problems to give personalized recommendations — not generic scripts.
          </p>
          <ul className="ac__list">
            {BULLETS.map((b) => (
              <li key={b}>
                <span className="ac__tick" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
          <div className="ac__cta">
            <a className="btn btn--ghost" href={CONSULT_URL} target={PREVIEW_MODE ? '_blank' : undefined} rel={PREVIEW_MODE ? 'noopener' : undefined} data-magnetic>
              <Ico d={I.chat} s={18} /> Talk to AI Consultant
            </a>
            <p className="ac__note">The window shows a scripted preview. {PREVIEW_MODE && 'The button opens the live consultant flow in a new tab.'}</p>
          </div>
        </div>

        {/* ---------------- consultant window (interactive scripted demo) ---------------- */}
        <div className={`cw cw--${view} ${typing ? 'is-typing' : ''}`} role="region" aria-label="AI Consultant preview — scripted demonstration">
          <nav className="cw__rail" aria-label="Consultant modes">
            <span className="cw__brand" aria-hidden="true">
              <Glyph name="consultant" size={16} />
            </span>
            <button type="button" className="cw__mode" aria-pressed={view !== 'voice'} aria-label="Text chat" onClick={view === 'voice' ? endVoice : undefined}>
              <Ico d={I.chat} />
            </button>
            <button type="button" className="cw__mode" aria-pressed={view === 'voice'} aria-label="Voice preview" onClick={view === 'voice' ? undefined : openVoice}>
              <Ico d={I.voice} />
            </button>
            <button type="button" className="cw__mode" aria-label="New chat" onClick={newChat}>
              <Ico d={I.plus} />
            </button>
            <span className="cw__me" aria-hidden="true" title="Sample profile">
              AC
            </span>
          </nav>

          <div className="cw__main">
            <ConsultantOrb energy={energy} live={live} className="cw__orb" />

            <header className="cw__head" aria-hidden={view !== 'chat'}>
              <div className="cw__who">
                <b>TechTivAI Consultant</b>
                <small>
                  <i className="cw__online" /> Online · grounded research
                </small>
              </div>
              <span className="cw__demo">Demo</span>
            </header>

            {/* home */}
            <div className="cw__home" aria-hidden={view !== 'home'}>
              <p className="cw__hi">Good to meet you, Acme.</p>
              <p className="cw__ask">What's slowing your business down?</p>
              <p className="cw__ctx">I've read your website, socials and assessment answers.</p>
            </div>

            {/* conversation */}
            <div ref={logRef} className="cw__log" role="log" aria-live="polite" aria-label="Sample conversation" aria-hidden={view !== 'chat'}>
              {msgs.map((m) =>
                m.from === 'note' ? (
                  <div key={m.id} className="cw__note">
                    <span className="cw__note-k">
                      <Glyph name="doc" size={12} /> {m.text}
                    </span>
                    <span className="cw__note-v">
                      {m.adds?.map((a) => (
                        <em key={a}>{a}</em>
                      ))}
                    </span>
                  </div>
                ) : (
                  <p key={m.id} className={`cw__msg cw__msg--${m.from}`}>
                    {m.text}
                  </p>
                ),
              )}
              {typing && (
                <p className="cw__msg cw__msg--ai cw__typing" aria-label="Consultant is typing">
                  <i /> <i /> <i />
                </p>
              )}
              {replies && (
                <div className="cw__chips" role="group" aria-label="Choose a sample reply">
                  <span className="cw__chips-k">Sample replies</span>
                  {replies.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      className="cw__chip"
                      onClick={() => {
                        userAct()
                        pickReply(r)
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {nextTopics && !typing && (
                <div className="cw__chips" role="group" aria-label="Ask about another topic">
                  <span className="cw__chips-k">Ask next</span>
                  {nextTopics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="cw__chip cw__chip--topic"
                      onClick={() => {
                        userAct()
                        startTopic(t.prompt, t)
                      }}
                    >
                      {t.prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* voice preview */}
            <div className="cw__voice" aria-hidden={view !== 'voice'}>
              <div className="cw__wave" aria-hidden="true">
                {Array.from({ length: 24 }, (_, i) => (
                  <i key={i} style={{ animationDelay: `${(i % 6) * -0.13 - Math.floor(i / 6) * 0.07}s` }} />
                ))}
              </div>
              <div className="cw__captions" aria-live="polite">
                {voiceLine && (
                  <p key={voiceStep} className={`cw__cap cw__cap--${voiceLine.who}`}>
                    <span>{voiceLine.who === 'ai' ? 'Consultant' : 'You (sample)'}</span>
                    {voiceLine.text}
                  </p>
                )}
              </div>
              <p className="cw__voice-k">Voice preview · captions only, no audio or microphone · real-time voice unlocks after your blueprint</p>
              <div className="cw__voice-ctl">
                {voiceDone && (
                  <button type="button" className="cw__round" onClick={runVoice} aria-label="Replay voice preview">
                    <Ico d={I.replay} />
                  </button>
                )}
                <button type="button" className="cw__round cw__round--end" onClick={endVoice} aria-label="End voice preview">
                  <Ico d={I.end} s={18} />
                </button>
              </div>
            </div>

            {/* composer + suggestions */}
            <div className="cw__dock" aria-hidden={view === 'voice'}>
              <form className="cw__composer" onSubmit={submit}>
                <label className="sr-only" htmlFor="cw-input">
                  Ask the consultant (scripted demo)
                </label>
                <input
                  ref={inputRef}
                  id="cw-input"
                  className="cw__input"
                  value={input}
                  onChange={(e) => {
                    userAct()
                    setInput(e.target.value)
                  }}
                  onFocus={userAct}
                  placeholder="Ask about your business…"
                  autoComplete="off"
                  tabIndex={view === 'voice' ? -1 : 0}
                />
                <div className="cw__bar">
                  <span className="cw__ctxchip">
                    <Glyph name="globe" size={12} /> acme.example
                  </span>
                  <span className="cw__ctxchip">
                    <Glyph name="doc" size={12} /> Assessment
                  </span>
                  <span className="cw__sample">sample profile</span>
                  <button type="button" className="cw__icon" onClick={openVoice} aria-label="Switch to voice preview" tabIndex={view === 'voice' ? -1 : 0}>
                    <Ico d={I.mic} />
                  </button>
                  <button type="submit" className="cw__send" aria-label="Send" disabled={!input.trim() || typing} tabIndex={view === 'voice' ? -1 : 0}>
                    <Ico d={I.send} />
                  </button>
                </div>
              </form>
              <div className="cw__suggest" aria-hidden={view !== 'home'}>
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="cw__card"
                    tabIndex={view === 'home' ? 0 : -1}
                    onClick={() => {
                      userAct()
                      startTopic(t.prompt, t)
                    }}
                  >
                    <b>
                      <Glyph name={t.id === 'leads' ? 'agent' : t.id === 'tools' ? 'link' : 'spark'} size={13} />
                      {t.tag}
                    </b>
                    <span>{t.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
