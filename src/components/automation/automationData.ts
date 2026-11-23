/* AI Automation — copy from the live section + the three-stage simulator.
   Everything below is deterministic sample data for a frontend-only demo. */

export const COPY = {
  eyebrow: 'AI Automation',
  title: ['Workflows that run', 'without the busywork.'],
  desc: 'Business process automation with n8n, Make, Zapier, and GHL — CRM, sales, marketing, appointments, and email.',
  intro: 'From trigger to execution',
  stages: [
    { n: '01', t: 'Select a trigger', d: 'Choose what starts the workflow.' },
    { n: '02', t: 'Connect your systems', d: 'Link the tools that run your business.' },
    { n: '03', t: 'Let automation work', d: 'Watch connected processes execute.' },
  ],
}

/* live service categories, kept and linked to the trigger they relate to */
export const SERVICES = [
  { id: 'crm', t: 'Workflow & CRM automation', d: 'Connect lead capture, qualification, and follow-up with n8n, Make, Zapier, or GHL.', tags: ['CRM sync', 'Lead routing', 'Email sequences'], trigger: 'lead' },
  { id: 'bots', t: 'Sales & support chatbots', d: 'Qualify leads and deflect support across web, WhatsApp, and messaging.', tags: ['WhatsApp', 'Lead bots', 'Support deflection'], trigger: 'form' },
  { id: 'ops', t: 'Appointment & marketing ops', d: 'Booking, reminders, nurture campaigns, and reporting on autopilot.', tags: ['Scheduling', 'Nurture', 'Reporting'], trigger: 'appointment' },
] as const

export type TriggerId = 'lead' | 'appointment' | 'form'
export type PlatformId = 'n8n' | 'make' | 'zapier'
export type AppId = 'ghl' | 'gmail' | 'slack'

export const TRIGGERS: { id: TriggerId; t: string; src: string; event: string; fields: [string, string][] }[] = [
  {
    id: 'lead',
    t: 'New lead received',
    src: 'Lead form',
    event: 'lead.created',
    fields: [
      ['Name', 'Sample Lead'],
      ['Source', 'Ads landing page'],
      ['Interest', 'Free consultation'],
    ],
  },
  {
    id: 'appointment',
    t: 'Appointment booked',
    src: 'Booking page',
    event: 'appointment.booked',
    fields: [
      ['Client', 'Sample Client'],
      ['Service', 'Discovery call'],
      ['Time', 'Tue · 10:00'],
    ],
  },
  {
    id: 'form',
    t: 'Website form submitted',
    src: 'Contact page',
    event: 'form.submitted',
    fields: [
      ['Form', 'Contact us'],
      ['Topic', 'Pricing question'],
      ['Email', 'sample@example.com'],
    ],
  },
]

export const PLATFORMS: { id: PlatformId; t: string }[] = [
  { id: 'n8n', t: 'n8n' },
  { id: 'make', t: 'Make' },
  { id: 'zapier', t: 'Zapier' },
]

export const APPS: { id: AppId; t: string; role: string }[] = [
  { id: 'ghl', t: 'GoHighLevel', role: 'CRM' },
  { id: 'gmail', t: 'Gmail', role: 'Email' },
  { id: 'slack', t: 'Slack', role: 'Team' },
]

/* task wording per trigger; app steps appear only when that app is connected.
   Nothing is ever "sent" — emails are prepared, the team is notified in-demo. */
const TASKS: Record<TriggerId, { first: string; ghl: string; gmail: string; slack: string }> = {
  lead: { first: 'Lead record prepared', ghl: 'CRM contact created', gmail: 'Follow-up email prepared', slack: 'Sales team alerted' },
  appointment: { first: 'Booking details captured', ghl: 'Appointment logged in CRM', gmail: 'Confirmation email prepared', slack: 'Team notified in #bookings' },
  form: { first: 'Submission parsed and tagged', ghl: 'Contact matched in CRM', gmail: 'Auto-reply prepared', slack: 'Inquiry posted to #sales' },
}

export type Task = { id: string; t: string; by: PlatformId | AppId }

export function buildTasks(trigger: TriggerId, platform: PlatformId, apps: AppId[]): Task[] {
  const w = TASKS[trigger]
  const order: AppId[] = ['ghl', 'gmail', 'slack']
  return [{ id: 'first', t: w.first, by: platform }, ...order.filter((a) => apps.includes(a)).map((a) => ({ id: a, t: w[a], by: a }))]
}

export const DEFAULTS = { trigger: 'lead' as TriggerId, platform: 'n8n' as PlatformId, apps: ['ghl', 'gmail'] as AppId[] }

/* run choreography (ms) */
export const T = { trigger: 900, route: 1000, task: 900 }
