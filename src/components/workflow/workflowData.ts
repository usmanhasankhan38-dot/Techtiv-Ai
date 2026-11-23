/* Section 03 content. Headline, description, pipeline stages and the four
   capability cards (with their descriptions) come from the live TechtivAI
   Workflow Automation section. Scenarios are illustrative demos only. */

export const STAGES = [
  { id: 'trigger', name: 'Trigger', hint: 'Event / Schedule / API' },
  { id: 'brain', name: 'AI Brain', hint: 'Classify & Decide' },
  { id: 'integrate', name: 'Integrate', hint: 'CRM / ERP / API' },
  { id: 'action', name: 'Action', hint: 'Send / Update / Alert' },
  { id: 'optimize', name: 'Optimize', hint: 'Self-Improves' },
] as const

export type StageId = (typeof STAGES)[number]['id']

export type Scenario = {
  id: string
  title: string
  desc: string
  icon: 'mail' | 'doc' | 'finance' | 'people'
  /** systems that light up during the Integrate stage (generic, no vendor claims) */
  systems: string[]
  /** per stage: short label under the node + one status line for the panel */
  steps: { label: string; status: string }[]
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'email',
    title: 'Email & Comms AI',
    desc: 'Auto-triage, reply drafting, sentiment routing, smart follow-ups',
    icon: 'mail',
    systems: ['Shared inbox', 'CRM', 'Calendar'],
    steps: [
      { label: 'Incoming enquiry', status: 'New enquiry received from the website form' },
      { label: 'AI classification', status: 'Classified as a sales lead with high intent' },
      { label: 'CRM connection', status: 'Contact created and enriched in the CRM' },
      { label: 'Automated response', status: 'Reply sent from a template your team approved' },
      { label: 'Follow-up optimization', status: 'Follow-up timing adjusted from reply patterns' },
    ],
  },
  {
    id: 'docs',
    title: 'Document Processing',
    desc: 'Invoice extraction, contract parsing, OCR, data validation',
    icon: 'doc',
    systems: ['Upload / email', 'OCR', 'Records system'],
    steps: [
      { label: 'Document received', status: 'Supplier contract uploaded for processing' },
      { label: 'AI extraction', status: 'Parties, dates and totals extracted' },
      { label: 'Data validation', status: 'Fields checked against your existing records' },
      { label: 'System update', status: 'Records updated, exceptions flagged for review' },
      { label: 'Processing complete', status: 'Document filed and searchable' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance Automation',
    desc: 'AP/AR automation, reconciliation, expense AI, reporting',
    icon: 'finance',
    systems: ['Invoice inbox', 'Accounting', 'Approvals'],
    steps: [
      { label: 'Invoice received', status: 'Invoice arrives in the finance inbox' },
      { label: 'AI data extraction', status: 'Vendor, amount and due date captured' },
      { label: 'Accounting integration', status: 'Draft bill prepared in accounting' },
      { label: 'Approval routing', status: 'Routed to the finance lead for approval' },
      { label: 'Reconciliation', status: 'Matched to the payment once approved' },
    ],
  },
  {
    id: 'hr',
    title: 'HR & Talent AI',
    desc: 'Resume screening, onboarding flows, leave management, payroll',
    icon: 'people',
    systems: ['Careers page', 'ATS', 'Team chat'],
    steps: [
      { label: 'Application received', status: 'New application from the careers page' },
      { label: 'AI-assisted screening', status: 'Experience summarised against the role' },
      { label: 'ATS integration', status: 'Candidate profile added to the ATS' },
      { label: 'Recruiter notification', status: 'Recruiter notified to review the shortlist' },
      { label: 'Workflow completion', status: 'Next steps logged once the recruiter decides' },
    ],
  },
]
