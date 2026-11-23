/* ==========================================================================
   AI Consultant — scripted demo data
   Everything here is a deterministic, local sample conversation. No AI
   service is called. To connect the real consultant later, replace
   `getScript` / `matchTopic` with calls to the production backend; the UI
   only depends on the `Turn` shape below.
   ========================================================================== */

export type Reply = { label: string; answer: string; adds: string[] }
export type Topic = {
  id: string
  tag: string
  prompt: string
  hint: string
  question: string
  replies: Reply[]
  keywords: string[]
}

/* The first topic reproduces the live site's sample conversation verbatim. */
export const TOPICS: Topic[] = [
  {
    id: 'leads',
    tag: 'Lead handling',
    prompt: 'Where do my leads get stuck?',
    hint: 'Find the slowest step between enquiry and booking.',
    question: "I reviewed your site and social profiles. Your booking flow looks manual — what's the biggest delay when a lead comes in?",
    replies: [
      {
        label: 'We still qualify leads by hand in WhatsApp and the CRM.',
        answer: "Got it. I'll prioritize lead automation and an AI qualification agent in your blueprint.",
        adds: ['Lead automation', 'AI qualification agent'],
      },
      {
        label: 'Enquiries after hours wait until the next morning.',
        answer: "Then an after-hours assistant that answers and books comes first — with a handover to your team for anything it can't handle.",
        adds: ['After-hours assistant', 'Team handover'],
      },
    ],
    keywords: ['lead', 'enquir', 'inquir', 'booking', 'whatsapp', 'qualif', 'sales'],
  },
  {
    id: 'tools',
    tag: 'Your tools',
    prompt: 'Which of my tools should talk to each other?',
    hint: 'Spot the manual hand-offs between your software.',
    question: 'From your assessment you use a CRM, an inbox, a booking tool and spreadsheets. Where do you re-type the same information most?',
    replies: [
      {
        label: 'Invoices — we copy jobs from spreadsheets.',
        answer: "Then connecting your job spreadsheet to invoicing is the first integration I'd put in your blueprint. It removes a manual step on every job.",
        adds: ['Spreadsheet → invoicing sync'],
      },
      {
        label: 'Customer details between the inbox and the CRM.',
        answer: 'Then an inbox-to-CRM sync goes first, so every enquiry lands as a contact without anyone copying it across.',
        adds: ['Inbox → CRM sync'],
      },
    ],
    keywords: ['tool', 'crm', 'software', 'integrat', 'connect', 'spreadsheet', 'invoice', 'stack', 'sync'],
  },
  {
    id: 'wins',
    tag: 'Quick wins',
    prompt: 'What should I automate first?',
    hint: 'Start where the effort is small and the time saved is real.',
    question: 'Two candidates stand out from your answers: lead follow-ups and appointment reminders. Which one takes more of your team’s time?',
    replies: [
      {
        label: 'Lead follow-ups.',
        answer: "Then automated follow-ups go first, using message templates your team approves. I'll note it as a phase-one item.",
        adds: ['Automated follow-ups', 'Phase 1'],
      },
      {
        label: 'Appointment reminders.',
        answer: "Then booking reminders and confirmations come first — quick to set up, and your staff keep control of the calendar.",
        adds: ['Booking reminders', 'Phase 1'],
      },
    ],
    keywords: ['automat', 'first', 'start', 'quick', 'win', 'priorit', 'remind', 'follow'],
  },
]

export const FALLBACK =
  'This preview runs a scripted sample, so I can only follow the three topics below. The live consultant answers from your own profile and assessment — start your assessment to try it.'

export function matchTopic(text: string): Topic | null {
  const t = text.toLowerCase()
  let best: Topic | null = null
  let score = 0
  for (const topic of TOPICS) {
    const s = topic.keywords.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0)
    if (s > score) {
      score = s
      best = topic
    }
  }
  return best
}

/* Voice preview: captions only — no audio, no microphone access. */
export const VOICE_SCRIPT: { who: 'ai' | 'you'; text: string; ms: number }[] = [
  { who: 'ai', text: "Hi — I'm ready when you are. What takes up most of your week?", ms: 3400 },
  { who: 'you', text: 'Chasing leads and confirming bookings.', ms: 2600 },
  { who: 'ai', text: "Then let's look at automated follow-ups and booking reminders first. I'll add both to your blueprint.", ms: 4200 },
]
