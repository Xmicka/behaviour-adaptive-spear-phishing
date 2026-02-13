/*
  Mock backend client.
  - All responses are mocked for demo-only usage.
  - Replace implementations with real API calls when integrating with backend.
  - Mock data is designed to roughly match `backend/data/final_risk_scores.csv` fields.
*/

type Overview = {
  totalUsers: number
  highRisk: number
  activeTraining: number
  lastSimulation: string
  avgRisk: number
}

const MOCK_USERS = [
  { user: 'charlie', final_risk_score: 0.70, last_simulated: '2026-02-12T10:12:00Z' },
  { user: 'bob', final_risk_score: 0.66, last_simulated: '2026-02-12T09:40:00Z' },
  { user: 'alice', final_risk_score: 0.30, last_simulated: '2026-02-11T08:00:00Z' }
]

export async function fetchOverview(): Promise<Overview> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 300))
  const totalUsers = MOCK_USERS.length
  const highRisk = MOCK_USERS.filter((u) => u.final_risk_score >= 0.66).length
  const activeTraining = Math.max(0, highRisk - 0) // demo only
  const lastSimulation = MOCK_USERS.reduce((a, b) => (a.last_simulated > b.last_simulated ? a : b)).last_simulated
  const avgRisk = MOCK_USERS.reduce((s, u) => s + u.final_risk_score, 0) / totalUsers
  return { totalUsers, highRisk, activeTraining, lastSimulation, avgRisk }
}

export async function generateEmail(theme: string): Promise<{ subject: string; body: string; target_behavior: string; risk_score: number }>{
  await new Promise((r) => setTimeout(r, 250))
  // Themes drive the mock content and likely targeted behavior
  const templates: Record<string, any> = {
    'Invoice': {
      subject: 'Invoice #20260213 — Action Required',
      body: 'Please review attached invoice for your account and confirm payment details.',
      target_behavior: 'Urgency + Financial Action',
      risk_score: 0.72
    },
    'HR Update': {
      subject: 'Mandatory HR Policy Update — Please Review',
      body: 'We require all staff to review the updated HR policies via the link provided.',
      target_behavior: 'Authority + Compliance',
      risk_score: 0.55
    },
    'IT Alert': {
      subject: 'Security Alert — Reset Your Password',
      body: 'Unusual activity detected. Reset your password using the internal link provided.',
      target_behavior: 'Fear + Credential Entry',
      risk_score: 0.80
    }
  }
  return templates[theme] || templates['Invoice']
}

export async function fetchPipeline(): Promise<{ stage: string; count: number }[]> {
  await new Promise((r) => setTimeout(r, 200))
  // Sent → Opened → Clicked → Training → Resolved
  return [
    { stage: 'Sent', count: 120 },
    { stage: 'Opened', count: 74 },
    { stage: 'Clicked', count: 22 },
    { stage: 'Training', count: 16 },
    { stage: 'Resolved', count: 14 }
  ]
}

export async function fetchMicroTrainingForRisk(riskScore: number){
  await new Promise((r) => setTimeout(r, 150))
  return {
    threshold: 0.66,
    why: 'The message leverages urgency cues and financial language to prompt immediate action. This pattern is strongly associated with credential or invoice fraud.',
    advice: 'Slow down when asked to transfer funds or provide credentials. Verify with an alternate channel (phone or internal ticket).',
    videoId: 'dQw4w9WgXcQ' // placeholder video id for demo; replace in prod
  }
}
