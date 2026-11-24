/* Blueprint Preview — live copy + the 11 live report sections, grouped
   into five chapters. Visual contents are a labelled sample (Sample Co.). */
export const COPY = {
  eyebrow: 'Blueprint Preview',
  title: ["What's inside your", 'AI Blueprint'],
  desc: 'Your first blueprint is free, including the PDF. A later new website is a one-time payment before we start it.',
  cta: 'Get My AI Blueprint',
}

export const CHAPTERS = [
  {
    n: '01',
    t: 'Business Intelligence',
    d: 'How your business runs today, the tools it runs on, and where work gets stuck.',
    items: ['Business Analysis', 'Current Technology Stack', 'Business Problems'],
  },
  {
    n: '02',
    t: 'AI Opportunity Discovery',
    d: 'Where AI and automation fit, and which agents or chatbots are worth building.',
    items: ['AI & Automation Opportunities', 'AI Agent & Chatbot Recommendations'],
  },
  {
    n: '03',
    t: 'Digital Architecture',
    d: 'What to build on the web and in apps, and the technology stack behind it.',
    items: ['Web/App Development Recommendations', 'Recommended Technology Stack'],
  },
  {
    n: '04',
    t: 'Growth & Impact',
    d: 'Where digital growth can come from, and an estimate of the impact to weigh.',
    items: ['Social & Digital Growth', 'ROI / Impact Analysis'],
  },
  {
    n: '05',
    t: 'Execution Blueprint',
    d: 'A phased roadmap and the TechTivAI services that would deliver it.',
    items: ['Implementation Roadmap', 'Recommended TechTivAI Services'],
  },
] as const

export const ALL_ITEMS = CHAPTERS.flatMap((c) => c.items)

/* ---- sample visual content ---- */
export const TOOLS = ['CRM', 'Email', 'Spreadsheets', 'Website']
export const PROBLEMS = ['Leads followed up by hand', 'Customer data in 4 places', 'Weekly reports built manually']

export const OPPS = [
  { id: 'sales', t: 'Sales', o: 'Lead qualification agent', d: 'Qualifies new leads and books calls for the team to confirm.', x: 50, y: 12 },
  { id: 'support', t: 'Support', o: 'Website chatbot', d: 'Answers common questions and hands off to a person.', x: 86, y: 32 },
  { id: 'marketing', t: 'Marketing', o: 'Content assistant', d: 'Drafts posts and emails for review before publishing.', x: 86, y: 70 },
  { id: 'ops', t: 'Operations', o: 'Workflow automation', d: 'Moves data between tools without copy-paste.', x: 50, y: 88 },
  { id: 'finance', t: 'Finance', o: 'Invoice processing', d: 'Captures invoices and prepares them for approval.', x: 14, y: 70 },
  { id: 'hr', t: 'People', o: 'Onboarding flow', d: 'Sends checklists and reminders to new hires.', x: 14, y: 32 },
]

export const LAYERS = [
  { k: 'Experience', chips: ['Website', 'Client portal', 'Mobile app'] },
  { k: 'AI layer', chips: ['Assistant', 'AI search', 'Recommendations'] },
  { k: 'Automation', chips: ['n8n workflows', 'Integrations'] },
  { k: 'Data & backend', chips: ['API', 'Database', 'CRM'] },
]

export const CHANNELS = [
  { k: 'Search', v: 0.72 },
  { k: 'Social', v: 0.54 },
  { k: 'Email', v: 0.41 },
  { k: 'Referral', v: 0.3 },
]

export const PHASES = [
  { k: 'Phase 1', t: 'Quick wins', d: 'Automate follow-up' },
  { k: 'Phase 2', t: 'Build', d: 'Portal + assistant' },
  { k: 'Phase 3', t: 'Scale', d: 'Agents across teams' },
]
export const SERVICES = ['Workflow automation', 'AI agents', 'Web & app development']
