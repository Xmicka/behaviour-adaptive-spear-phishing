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
  // Prefer backend API if available; fall back to mocked data for dev/demo
  try {
    const res = await fetch('/api/risk-summary')
    if (!res.ok) throw new Error('no api')
    const json = await res.json()
    const data = json.data || []
    const totalUsers = data.length
    const highRisk = data.filter((d: any) => d.tier === 'High').length
    const activeTraining = data.filter((d: any) => d.action_taken === 'Training triggered').length
    const lastSimulation = new Date().toISOString()
    const avgRisk = data.reduce((s: number, u: any) => s + (u.risk_score || 0), 0) / Math.max(1, totalUsers)
    return { totalUsers, highRisk, activeTraining, lastSimulation, avgRisk }
  } catch (err) {
    // Fallback to demo mocks
    await new Promise((r) => setTimeout(r, 300))
    const totalUsers = MOCK_USERS.length
    const highRisk = MOCK_USERS.filter((u) => u.final_risk_score >= 0.66).length
    const activeTraining = Math.max(0, highRisk - 0) // demo only
    const lastSimulation = MOCK_USERS.reduce((a, b) => (a.last_simulated > b.last_simulated ? a : b)).last_simulated
    const avgRisk = MOCK_USERS.reduce((s, u) => s + u.final_risk_score, 0) / totalUsers
    return { totalUsers, highRisk, activeTraining, lastSimulation, avgRisk }
  }
}

export async function generateEmail(theme: string): Promise<{ subject: string; body: string; target_behavior: string; risk_score: number }> {
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
  // Sent → Opened → Clicked → Training → Resolved (mocked)
  return [
    { stage: 'Sent', count: 120 },
    { stage: 'Opened', count: 74 },
    { stage: 'Clicked', count: 22 },
    { stage: 'Training', count: 16 },
    { stage: 'Resolved', count: 14 }
  ]
}

export async function fetchMicroTrainingForRisk(riskScore: number) {
  // Prefer backend training-status API
  try {
    const res = await fetch('/api/training-status')
    if (!res.ok) throw new Error('no api')
    const json = await res.json()
    // Simplified: return a generic payload when API is present
    return {
      threshold: 0.66,
      why: 'See training status from backend',
      advice: 'Follow the recommended micro or mandatory training.',
      videoId: 'dQw4w9WgXcQ',
      raw: json.data
    }
  } catch (err) {
    await new Promise((r) => setTimeout(r, 150))
    return {
      threshold: 0.66,
      why: 'The message leverages urgency cues and financial language to prompt immediate action. This pattern is strongly associated with credential or invoice fraud.',
      advice: 'Slow down when asked to transfer funds or provide credentials. Verify with an alternate channel (phone or internal ticket).',
      videoId: 'dQw4w9WgXcQ' // placeholder video id for demo; replace in prod
    }
  }
}

export async function fetchRiskSummary() {
  try {
    const res = await fetch('/api/risk-summary')
    if (!res.ok) throw new Error('no api')
    const json = await res.json()
    return json.data || []
  } catch (e) {
    // fallback: synthesize from mocks
    return MOCK_USERS.map(u => ({ user: u.user, risk_score: u.final_risk_score, tier: u.final_risk_score >= 0.66 ? 'High' : u.final_risk_score >= 0.3 ? 'Medium' : 'Low', reason_tags: [], action_taken: u.final_risk_score >= 0.66 ? 'Training triggered' : 'No action' }))
  }
}

// ============ COLLECTOR API FUNCTIONS ============

export type CollectorStats = {
  total_events: number
  unique_users: number
  unique_sessions: number
  event_types: Record<string, number>
  last_event_at: string | null
  events_last_hour: number
  db_path: string
  recent_pipeline_runs: Array<{
    id: number
    started_at: string
    finished_at: string | null
    status: string
    event_count: number
    user_count: number
    error: string
  }>
}

export type CollectorEvent = {
  id: number
  user_id: string
  session_id: string
  event_type: string
  event_data: string
  page_url: string
  timestamp: string
  ip_address: string
  user_agent: string
  created_at: string
}

export type PipelineRunResult = {
  status: string
  run_id?: number
  events_processed?: number
  users_analyzed?: number
  high_risk_users?: number
  message?: string
  timestamp?: string
}

export async function fetchCollectorStats(): Promise<CollectorStats> {
  try {
    const res = await fetch('/api/events/stats')
    if (!res.ok) throw new Error('stats API unavailable')
    return await res.json()
  } catch (err) {
    return {
      total_events: 0,
      unique_users: 0,
      unique_sessions: 0,
      event_types: {},
      last_event_at: null,
      events_last_hour: 0,
      db_path: '',
      recent_pipeline_runs: [],
    }
  }
}

export async function fetchEvents(params?: {
  user_id?: string
  event_type?: string
  since?: string
  limit?: number
}): Promise<{ data: CollectorEvent[]; count: number }> {
  try {
    const query = new URLSearchParams()
    if (params?.user_id) query.set('user_id', params.user_id)
    if (params?.event_type) query.set('event_type', params.event_type)
    if (params?.since) query.set('since', params.since)
    if (params?.limit) query.set('limit', params.limit.toString())

    const res = await fetch(`/api/events?${query.toString()}`)
    if (!res.ok) throw new Error('events API unavailable')
    return await res.json()
  } catch (err) {
    return { data: [], count: 0 }
  }
}

export async function triggerPipelineRun(): Promise<PipelineRunResult> {
  try {
    const res = await fetch('/api/pipeline/run', { method: 'POST' })
    const json = await res.json()
    return json
  } catch (err) {
    return { status: 'error', message: 'Failed to connect to pipeline API' }
  }
}

// ============ DASHBOARD DATA ============

export type DashboardUser = {
  user_id: string
  risk_score: number
  tier: 'High' | 'Medium' | 'Low'
  risk_reason: string
  login_count: number
  failed_login_ratio: number
  anomaly_score: number
  ml_anomaly_score: number
}

export type DashboardAlert = {
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
}

export type DashboardRecommendation = {
  priority: 'urgent' | 'high' | 'medium'
  title: string
  description: string
  impact: string
}

export type TrainingEntry = {
  user_id: string
  training_action: string
  micro_training_url: string
  mandatory_training_url: string
  is_pending: boolean
}

export type DashboardData = {
  posture: {
    overall_risk_level: string
    total_users: number
    avg_risk_score: number
    training_pending: number
    total_events_collected: number
    last_pipeline_run: string | null
  }
  risk_distribution: { high: number; medium: number; low: number }
  users: DashboardUser[]
  user_event_counts: Record<string, number>
  training: TrainingEntry[]
  alerts: DashboardAlert[]
  recommendations: DashboardRecommendation[]
  event_stats: CollectorStats
  pipeline_runs: Array<{
    id: number
    started_at: string
    finished_at: string | null
    status: string
    event_count: number
    user_count: number
    error: string
  }>
}

export async function fetchDashboardData(): Promise<DashboardData | null> {
  try {
    const res = await fetch('/api/dashboard')
    if (!res.ok) throw new Error('dashboard unavailable')
    return await res.json()
  } catch (err) {
    return null
  }
}

// ============ EMAIL GENERATOR ============

export type GeneratedEmail = {
  email: {
    subject: string
    body: string
    from_name: string
    from_email: string
    scenario: string
    generated_at: string
  }
  profile: {
    user_id: string
    total_events: number
    sessions: number
    pages_visited: string[]
    total_clicks: number
    total_page_views: number
    copy_paste_events: number
    avg_typing_speed_ms: number | null
    risk_score: number | null
    risk_reason: string
  }
  risk_factors: string[]
  adaptation_summary: {
    urgency_level: string
    personalization_depth: string
    attack_vector: string
  }
}

export async function generatePhishingEmail(
  user_id: string,
  scenario: string,
  context?: string
): Promise<GeneratedEmail | null> {
  try {
    const res = await fetch('/api/generate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, scenario, context: context || '' }),
    })
    if (!res.ok) throw new Error('email generation failed')
    return await res.json()
  } catch (err) {
    return null
  }
}


