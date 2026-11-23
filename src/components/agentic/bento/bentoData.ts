/* ==========================================================================
   Stage 03 — bento demo data (local, deterministic, illustrative)
   Each card is a sequence of steps. The visual is a pure function of
   (step, variant), so replay and variant switches are always consistent.
   A future backend can drive the same `step`/`variant` props.
   ========================================================================== */
import type { AgentId } from '../agenticData'

export type Variant = { id: string; label: string }
export type Demo = {
  variants?: Variant[]
  /** step labels, per variant when the flow differs */
  steps: (variant: string) => string[]
  /** ms per step */
  ms: number
}

export const DEMOS: Record<AgentId, Demo> = {
  tivagent: {
    steps: () => ['New prospect found', 'Lead enters qualification', 'Fit confirmed', 'Intent confirmed', 'Timing confirmed', 'Meeting booked'],
    ms: 900,
  },
  contentbot: {
    variants: [
      { id: 'blog', label: 'Blog' },
      { id: 'social', label: 'Social' },
      { id: 'email', label: 'Email' },
    ],
    steps: () => ['Brief received', 'Drafting structure', 'Refining copy', 'Tone adjusted', 'Ready to publish'],
    ms: 950,
  },
  researchbot: {
    variants: [
      { id: 'market', label: 'Market' },
      { id: 'competitors', label: 'Competitors' },
      { id: 'news', label: 'News' },
    ],
    steps: () => ['Sources mapped', 'Scanning sources', 'Relevant sources found', 'Connecting findings', 'Insight ready'],
    ms: 950,
  },
  supportgenie: {
    variants: [
      { id: 'general', label: 'General inquiry' },
      { id: 'escalation', label: 'Human escalation' },
    ],
    steps: (v) =>
      v === 'escalation'
        ? ['Inquiry received', 'Intent identified · urgent', 'Billing policy found', 'Escalation prepared', 'Routed to a person', 'Assigned to billing team']
        : ['Inquiry received', 'Intent identified', 'Help article found', 'Reply drafted', 'Agent approves reply', 'Resolved'],
    ms: 900,
  },
  financeai: {
    variants: [
      { id: 'revenue', label: 'Revenue' },
      { id: 'expenses', label: 'Expenses' },
      { id: 'forecast', label: 'Forecast' },
    ],
    steps: () => ['Chart ready', 'History drawn', 'Data points marked', 'Forecast projected', 'Insight highlighted'],
    ms: 900,
  },
  legalmind: {
    variants: [
      { id: 'policy', label: 'Policy' },
      { id: 'contract', label: 'Contract' },
      { id: 'risk', label: 'Risk' },
    ],
    steps: () => ['Document received', 'Scanning document', 'Clauses highlighted', 'Review markers added', 'Summary ready'],
    ms: 950,
  },
  opsbot: {
    steps: () => ['Stock alert triggered', 'Inventory checked', 'Decision · reorder', 'Quotes requested', 'Manager approval', 'Order confirmed'],
    ms: 900,
  },
}

/* --- per-card content (all sample) --- */
export const CONTENT_MODES: Record<string, { title: string; tone: [string, string]; blocks: ('h' | 'l' | 's' | 'img' | 'sq' | 'tags' | 'btn' | 'subj')[] }> = {
  blog: { title: 'Blog post', tone: ['Casual', 'Expert'], blocks: ['h', 'l', 'l', 's', 'img', 'l', 's'] },
  social: { title: 'Social post', tone: ['Formal', 'Friendly'], blocks: ['sq', 'l', 's', 'tags'] },
  email: { title: 'Email', tone: ['Salesy', 'Helpful'], blocks: ['subj', 'h', 'l', 'l', 's', 'btn'] },
}

export const RESEARCH: Record<string, { nodes: number[]; insight: string }> = {
  market: { nodes: [0, 3, 6], insight: 'Demand signals are rising in two service areas.' },
  competitors: { nodes: [1, 4, 7], insight: 'Two competitors now offer online booking.' },
  news: { nodes: [2, 5, 8], insight: 'New local regulations take effect next quarter.' },
}
export const RESEARCH_NODES = [
  { t: 'Industry report', c: 'market' },
  { t: 'Pricing pages', c: 'competitors' },
  { t: 'Local news', c: 'news' },
  { t: 'Search trends', c: 'market' },
  { t: 'Reviews', c: 'competitors' },
  { t: 'Press releases', c: 'news' },
  { t: 'Survey data', c: 'market' },
  { t: 'Job listings', c: 'competitors' },
  { t: 'Regulators', c: 'news' },
]

export const SUPPORT: Record<string, { msg: string; intent: string; kb: string; out: string; end: string }> = {
  general: {
    msg: 'How do I move my booking to Thursday?',
    intent: 'Booking change',
    kb: 'Help article · Rescheduling',
    out: 'You can move it from the link in your confirmation email — I’ve added the steps below.',
    end: 'Resolved',
  },
  escalation: {
    msg: 'I was charged twice and need this fixed today.',
    intent: 'Billing dispute · urgent',
    kb: 'Billing policy · Duplicate charges',
    out: 'Handed to the billing team with the order and payment history attached.',
    end: 'Assigned',
  },
}

/* finance series: 12 sample points each, plus 3 forecast points */
export const FINANCE: Record<string, { label: string; unit: string; data: number[]; fc: number[]; insight: string; delta: string }> = {
  revenue: { label: 'Revenue', unit: 'index', data: [42, 45, 44, 50, 52, 49, 56, 60, 58, 63, 67, 70], fc: [72, 75, 79], insight: 'Strongest growth in the last quarter', delta: '+11% vs prior quarter' },
  expenses: { label: 'Expenses', unit: 'index', data: [38, 39, 41, 40, 44, 43, 45, 47, 46, 48, 47, 49], fc: [50, 50, 51], insight: 'Software spend is the fastest-growing line', delta: '+4% vs prior quarter' },
  forecast: { label: 'Forecast', unit: 'index', data: [42, 45, 44, 50, 52, 49, 56, 60, 58, 63, 67, 70], fc: [74, 79, 85], insight: 'Projection assumes current growth continues', delta: 'Range shown as shaded band' },
}

export const LEGAL: Record<string, { doc: string; hl: number[]; rules: [string, boolean][]; risk: 'Low' | 'Medium'; note: string }> = {
  policy: { doc: 'Data handling policy', hl: [1, 4], rules: [['Retention period stated', true], ['Access controls defined', true], ['Breach contact listed', false]], risk: 'Low', note: '1 item to confirm' },
  contract: { doc: 'Service agreement', hl: [2, 6, 9], rules: [['Payment terms present', true], ['Liability cap present', true], ['Auto-renewal notice', false]], risk: 'Medium', note: '1 clause for legal review' },
  risk: { doc: 'Supplier contract', hl: [3, 7], rules: [['Termination rights', true], ['Indemnity scope', false], ['Data transfer terms', false]], risk: 'Medium', note: '2 clauses flagged' },
}

export const OPS_NODES = [
  { id: 'trigger', t: 'Stock alert', d: 'Inventory falls below the reorder threshold for a sample item.' },
  { id: 'check', t: 'Check inventory', d: 'Confirms current stock and recent usage before acting.' },
  { id: 'decide', t: 'Reorder?', d: 'Decision: reorder now, or keep monitoring.' },
  { id: 'quotes', t: 'Request quotes', d: 'Asks approved vendors for price and delivery time.' },
  { id: 'approve', t: 'Manager approval', d: 'A person approves the order before it is placed.' },
  { id: 'done', t: 'Order confirmed', d: 'Supplier confirms; the team is notified.' },
]
