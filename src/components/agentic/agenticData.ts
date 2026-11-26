/* ==========================================================================
   AI / Agentic Solutions — content + deterministic demo data
   Titles and descriptions are verbatim from the live TechtivAI section.
   Everything labelled "step", "task" or "flow" is an illustrative,
   scripted demonstration — nothing here calls an AI service.
   To integrate real agents later, replace the scripted `task` / `flow`
   data with backend state; the UI only reads these shapes.
   ========================================================================== */

export const COPY = {
  eyebrow: 'AI / Agentic Solutions',
  title: ['Autonomous agents for', 'sales, support, and ops'],
  desc: 'Multi-agent systems that plan, use tools, and execute — sales agents, support agents, and operations agents that work around the clock.',
  featured: 'techtivai',
  featuredAccent: 'Agent Suite',
  featuredDesc: 'Deploy specialized AI agents that collaborate on research, outreach, analysis, and execution — built on LangGraph and CrewAI.',
  cta: 'See if agents fit your business',
}

export type ModuleId = 'research' | 'analysis' | 'outreach' | 'compliance'
export type Module = {
  id: ModuleId
  /** console number, as numbered in the brief */
  n: string
  name: string
  desc: string
  side: 'left' | 'right'
  explain: string
  /** illustrative, scripted task — three steps then a result */
  steps: [string, string, string]
  result: string
}

/* array order = the automatic hand-off order: research → analysis → outreach → compliance */
export const MODULES: Module[] = [
  {
    id: 'research',
    n: '01',
    name: 'Research Agent',
    desc: 'Deep web research, competitor analysis, market intel',
    side: 'left',
    explain: 'Gathers context first: public sources, competitors and market signals relevant to the request.',
    steps: ['Scanning sources', 'Organizing findings', 'Preparing insights'],
    result: 'Insights ready',
  },
  {
    id: 'analysis',
    n: '03',
    name: 'Analysis Agent',
    desc: 'Data analysis, report generation, KPI tracking',
    side: 'left',
    explain: 'Turns the research and your data into indicators the team can act on.',
    steps: ['Organizing data', 'Evaluating indicators', 'Preparing report'],
    result: 'Report prepared',
  },
  {
    id: 'outreach',
    n: '02',
    name: 'Outreach Agent',
    desc: 'Personalized email sequences, follow-ups, booking',
    side: 'right',
    explain: 'Prepares personalised sequences and follow-ups from what the other agents found.',
    steps: ['Preparing sequence', 'Reviewing personalization', 'Scheduling follow-up'],
    result: 'Follow-up scheduled',
  },
  {
    id: 'compliance',
    n: '04',
    name: 'Compliance Agent',
    desc: 'Document review, policy checks, risk assessment',
    side: 'right',
    explain: 'Checks the output against your policies before anything goes out.',
    steps: ['Reviewing document', 'Checking policy criteria', 'Preparing review summary'],
    result: 'Review summary ready',
  },
]

/* the coordinated demo: a request enters, agents work in turn, a person approves */
export const DEMO_REQUEST = 'Sample request · “Find and contact new prospects in our region”'
export const REVIEW_STEP = 'Ready for your review — nothing is sent until a person approves.'

export type AgentId = 'tivagent' | 'contentbot' | 'researchbot' | 'supportgenie' | 'financeai' | 'legalmind' | 'opsbot'
export type Agent = {
  id: AgentId
  name: string
  role: string
  desc: string
  /** kept from the source data; not shown in the demo */
  status: 'live' | 'beta'
  span: 'one' | 'two'
  flow: string[]
}

export const AGENTS: Agent[] = [
  {
    id: 'tivagent',
    name: 'TivAgent',
    role: 'Sales SDR',
    desc: 'Prospects, qualifies, books meetings autonomously',
    status: 'live',
    span: 'one',
    flow: ['New lead arrives', 'Qualified against your criteria', 'Meeting slot offered', 'Booked to the team calendar'],
  },
  {
    id: 'contentbot',
    name: 'ContentBot',
    role: 'Writer Agent',
    desc: 'Blogs, ads, social posts at scale',
    status: 'live',
    span: 'one',
    flow: ['Brief received', 'Draft written', 'Team review', 'Scheduled to publish'],
  },
  {
    id: 'researchbot',
    name: 'ResearchBot',
    role: 'Intel Agent',
    desc: 'Market research, news monitoring, summaries',
    status: 'live',
    span: 'one',
    flow: ['Sources monitored', 'Relevant items filtered', 'Findings summarised', 'Insight brief shared'],
  },
  {
    id: 'supportgenie',
    name: 'SupportGenie',
    role: 'CS Agent',
    desc: 'Tier-1 support, refunds, escalations',
    status: 'live',
    span: 'two',
    flow: ['Customer message arrives', 'Classified by topic', 'Routed to the right queue', 'Reply suggested for an agent to approve'],
  },
  {
    id: 'financeai',
    name: 'FinanceAI',
    role: 'CFO Agent',
    desc: 'Invoice processing, expense reports, forecasting',
    status: 'beta',
    span: 'one',
    flow: ['Invoices captured', 'Expenses categorised', 'Report assembled', 'Forecast updated'],
  },
  {
    id: 'legalmind',
    name: 'LegalMind',
    role: 'Compliance Agent',
    desc: 'Contract review, clause extraction, risk scoring',
    status: 'beta',
    span: 'one',
    flow: ['Contract uploaded', 'Clauses extracted', 'Risks scored', 'Flagged for legal review'],
  },
  {
    id: 'opsbot',
    name: 'OpsBot',
    role: 'Operations Agent',
    desc: 'Supply chain monitoring, vendor management',
    status: 'live',
    span: 'two',
    flow: ['Stock alert raised', 'Vendors checked', 'Order sent for approval', 'Supplier confirmed'],
  },
]
