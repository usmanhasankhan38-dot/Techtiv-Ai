/* AI-Powered Web & App Development — copy + deterministic demo data.
   All three products are local simulations: no model, no API, sample data. */

export const COPY = {
  eyebrow: 'AI-Powered Web & App Development',
  title: ['Products with AI', 'built into the experience.'],
  desc: 'Websites, SaaS platforms, dashboards, portals, and mobile apps — with AI search, assistants, and automation inside.',
  note: 'Illustrative product demos · scripted responses and sample data · no live AI, accounts or customer data',
}

export const CARDS = [
  { id: 'web', n: '01', t: 'AI-Powered Websites', d: 'Web experiences with intelligent search, personalization, and conversion-focused interactions.' },
  { id: 'app', n: '02', t: 'Web Apps & Customer Portals', d: 'Custom SaaS platforms, dashboards, and portals with intelligent tools built in.' },
  { id: 'mobile', n: '03', t: 'Mobile AI Experiences', d: 'iOS and Android experiences with intelligent assistance, voice, recommendations, and automation.' },
] as const

/* ---------------- 01 · website search ---------------- */
export type Result = { kind: string; t: string; d: string; match: number }
export const QUERIES: { q: string; keys: string[]; answer: string; results: Result[]; cta: string }[] = [
  {
    q: 'Show me your automation services',
    keys: ['automat', 'workflow', 'service', 'crm'],
    answer: '3 services match “automation”',
    results: [
      { kind: 'Service', t: 'Workflow & CRM automation', d: 'Lead capture, routing and follow-up', match: 98 },
      { kind: 'Service', t: 'Appointment & marketing ops', d: 'Booking, reminders and nurture', match: 91 },
      { kind: 'Case study', t: 'Clinic intake, automated', d: 'Sample project · 4 min read', match: 84 },
    ],
    cta: 'Book an automation call',
  },
  {
    q: 'How much does a website cost?',
    keys: ['cost', 'price', 'pricing', 'website', 'budget', 'how much'],
    answer: 'Pricing guides for websites',
    results: [
      { kind: 'Guide', t: 'Website packages explained', d: 'What is included at each tier', match: 96 },
      { kind: 'Tool', t: 'Project estimate builder', d: 'Answer 5 questions for a range', match: 89 },
      { kind: 'FAQ', t: 'What affects the timeline?', d: 'Scope, content and integrations', match: 77 },
    ],
    cta: 'Get a tailored estimate',
  },
  {
    q: 'Do you build mobile apps?',
    keys: ['mobile', 'app', 'ios', 'android', 'phone'],
    answer: 'Mobile app capabilities',
    results: [
      { kind: 'Service', t: 'Mobile AI experiences', d: 'iOS and Android with assistants', match: 97 },
      { kind: 'Service', t: 'Customer portals', d: 'Pair the app with a web portal', match: 82 },
      { kind: 'Case study', t: 'Booking app with chat', d: 'Sample project · 3 min read', match: 79 },
    ],
    cta: 'Talk to a product lead',
  },
]

/* ---------------- 02 · portal dashboard ---------------- */
export type View = 'overview' | 'analytics' | 'insights'
export const VIEWS: { id: View; t: string }[] = [
  { id: 'overview', t: 'Overview' },
  { id: 'analytics', t: 'Analytics' },
  { id: 'insights', t: 'AI Insights' },
]
export const KPIS = [
  { k: 'Active projects', v: 12, d: '+2 this month' },
  { k: 'Open requests', v: 5, d: '3 awaiting reply' },
  { k: 'Tasks due', v: 8, d: 'This week' },
]
export const PROJECTS = [
  { t: 'Website relaunch', c: 'Sample Co.', p: 0.82 },
  { t: 'Booking portal', c: 'Clinic demo', p: 0.56 },
  { t: 'Sales dashboard', c: 'Retail demo', p: 0.34 },
]
export const ACTIVITY = [
  { t: 'Invoice #1042 approved', w: '2m' },
  { t: 'New request from Sample Co.', w: '18m' },
  { t: 'Booking portal deployed to staging', w: '1h' },
]
/* sessions index — sample series, two ranges */
export const SERIES: Record<'7d' | '30d', { labels: string[]; v: number[]; total: string }> = {
  '7d': { labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], v: [42, 48, 45, 58, 62, 51, 66], total: '372' },
  '30d': { labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], v: [210, 236, 228, 260, 284, 270, 312], total: '1,800' },
}
export const CHANNELS = [
  { k: 'Search', v: 0.46 },
  { k: 'Referral', v: 0.28 },
  { k: 'Email', v: 0.17 },
  { k: 'Social', v: 0.09 },
]
export const INSIGHTS = [
  { id: 'i1', tag: 'Opportunity', t: 'Requests peak on Tuesdays', d: 'Shift one support shift to Tuesday mornings.', act: 'Adjust schedule' },
  { id: 'i2', tag: 'Risk', t: 'Booking portal is behind plan', d: 'Two tasks are blocked on client content.', act: 'Send reminder draft' },
  { id: 'i3', tag: 'Suggestion', t: 'Search drives most visits', d: 'Add an AI answer to the top 5 queries.', act: 'Create task' },
]

/* ---------------- 03 · mobile assistant ---------------- */
export type Prompt = 'find' | 'schedule' | 'recommend'
export const PROMPTS: { id: Prompt; t: string }[] = [
  { id: 'find', t: 'Find a service' },
  { id: 'schedule', t: 'Schedule a consultation' },
  { id: 'recommend', t: 'Show recommendations' },
]
export const REPLIES: Record<Prompt, string> = {
  find: 'Here are services that fit a growing team. Tap one to learn more.',
  schedule: 'Happy to set that up. These 30-minute slots are open:',
  recommend: 'Based on your recent activity, you might like:',
}
export const SERVICES_M = ['AI website', 'Customer portal', 'Workflow automation']
export const SLOTS = ['Tue · 10:00', 'Wed · 14:30', 'Thu · 09:00']
export const RECS = [
  { t: 'Automation audit', d: '30 min · free' },
  { t: 'Portal starter kit', d: 'Template · sample' },
]
