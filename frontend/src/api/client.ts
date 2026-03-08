/*
  Backend API client.
  - Fetches real data from the Flask backend at /api/*
  - Falls back to empty/mock data when backend is unreachable
*/

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function apiUrl(path: string): string {
  // In development, use relative paths for Vite proxy; otherwise use full URL
  if (import.meta.env.DEV) {
    return path
  }
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

// ============ TYPES ============

type Overview = {
  totalUsers: number
  highRisk: number
  activeTraining: number
  lastSimulation: string
  avgRisk: number
}

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
  emails_auto_sent?: number
  email_details?: EmailSendResult[]
  message?: string
  timestamp?: string
}

export type DashboardUser = {
  user_id: string
  name?: string
  email?: string
  department?: string
  training_status?: string
  is_active?: number
  employee_id?: string
  device_id?: string
  metrics?: any
  risk_score: number
  tier: 'High' | 'Medium' | 'Low'
  risk_reason: string
  login_count: number
  failed_login_ratio: number
  anomaly_score: number
  ml_anomaly_score: number
  tab_burst_count?: number
  unusual_hours_login?: number
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
  has_pending_training?: boolean
  completed_sessions?: number
  total_sessions?: number
  sessions?: TrainingSession[]
}

export type TrainingSession = {
  session_id: string
  user_id: string
  trigger_email_id: string
  training_type: string
  status: string
  assigned_at: string
  started_at: string | null
  completed_at: string | null
  score: number
}

export type EmailLogEntry = {
  email_id: string
  tracking_token: string
  user_id: string
  recipient_email: string
  subject: string
  scenario: string
  template_id: string
  risk_score: number
  sent_via: string
  sent_at: string
  status: string
  interactions: EmailInteraction[]
  was_opened: boolean
  was_clicked: boolean
  was_reported: boolean
}

export type EmailInteraction = {
  id: number
  email_id: string
  tracking_token: string
  user_id: string
  interaction: string
  timestamp: string
}

export type LoginBehaviorEvent = {
  timestamp: string
  domain: string
}

export type RiskHistoryEntry = {
  timestamp: string
  risk_score: number
}

export type EmailStats = {
  total_sent: number
  total_opened: number
  total_clicked: number
  total_reported: number
  click_rate: number
  open_rate: number
}

export type TrainingStats = {
  total_sessions: number
  completed: number
  pending: number
  completion_rate: number
}

export type EmailSendResult = {
  email_id: string
  user_id: string
  recipient: string
  subject: string
  scenario: string
  template_id: string
  risk_score: number
  tracking_token: string
  sent: boolean
  mode: string
  error: string
  phishing_link: string
}

export type DashboardData = {
  posture: {
    security_score?: number
    overall_risk_level: string
    total_users: number
    avg_risk_score: number
    training_pending: number
    total_events_collected: number
    last_pipeline_run: string | null
    total_emails_sent?: number
    email_click_rate?: number
  }
  risk_distribution: { high: number; medium: number; low: number }
  users: DashboardUser[]
  user_event_counts: Record<string, number>
  user_email_counts?: Record<string, { total_sent: number; clicked: number; last_sent: string | null }>
  training: TrainingEntry[]
  training_stats?: TrainingStats
  email_log?: EmailLogEntry[]
  email_stats?: EmailStats
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
  user_states?: UserStateEntry[]
  state_distribution?: StateDistribution
  scheduler_status?: SchedulerStatus
}

export type Campaign = {
  id: number
  name: string
  target_tier: string
  scenario: string
  status: string
  created_at: string
  scheduled_for: string | null
  completed_at: string | null
}

export type GeneratedEmail = {
  email: {
    subject: string
    body: string
    body_html?: string
    from_name: string
    from_email: string
    scenario: string
    template_id?: string
    tracking_token?: string
    phishing_link?: string
    generated_at: string
  }
  profile: {
    user_id: string
    total_events: number
    sessions?: number
    pages_visited: string[]
    total_clicks: number
    total_page_views: number
    copy_paste_events: number
    avg_typing_speed_ms: number | null
    risk_score: number | null
    risk_reason: string
  }
  risk_factors: string[]
  adaptation_summary?: {
    urgency_level: string
    personalization_depth: string
    attack_vector: string
  }
  can_send?: boolean
  send_endpoint?: string
}

// ============ API FUNCTIONS ============

export async function fetchOverview(): Promise<Overview> {
  try {
    const res = await fetch(apiUrl('/api/risk-summary'))
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
    return { totalUsers: 0, highRisk: 0, activeTraining: 0, lastSimulation: '', avgRisk: 0 }
  }
}

export async function fetchRiskSummary() {
  try {
    const res = await fetch(apiUrl('/api/risk-summary'))
    if (!res.ok) throw new Error('no api')
    const json = await res.json()
    return json.data || []
  } catch (e) {
    return []
  }
}

export async function fetchCollectorStats(): Promise<CollectorStats> {
  try {
    const res = await fetch(apiUrl('/api/events/stats'))
    if (!res.ok) throw new Error('stats API unavailable')
    return await res.json()
  } catch (err) {
    return {
      total_events: 0, unique_users: 0, unique_sessions: 0,
      event_types: {}, last_event_at: null, events_last_hour: 0,
      db_path: '', recent_pipeline_runs: [],
    }
  }
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetch(apiUrl('/api/campaigns'))
    if (!res.ok) throw new Error('campaigns unavailable')
    const json = await res.json()
    return json.campaigns || []
  } catch (err) {
    return []
  }
}

export async function createCampaign(campaign: Partial<Campaign>): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/campaigns'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    })
    return await res.json()
  } catch (err) {
    return { error: 'Failed to create campaign' }
  }
}

export async function fetchEvents(params?: {
  user_id?: string; event_type?: string; since?: string; limit?: number
}): Promise<{ data: CollectorEvent[]; count: number }> {
  try {
    const query = new URLSearchParams()
    if (params?.user_id) query.set('user_id', params.user_id)
    if (params?.event_type) query.set('event_type', params.event_type)
    if (params?.since) query.set('since', params.since)
    if (params?.limit) query.set('limit', params.limit.toString())
    const res = await fetch(apiUrl(`/api/events?${query.toString()}`))
    if (!res.ok) throw new Error('events API unavailable')
    return await res.json()
  } catch (err) {
    return { data: [], count: 0 }
  }
}

export async function fetchEmployees(): Promise<any[]> {
  try {
    const res = await fetch(apiUrl('/api/employees'))
    if (!res.ok) throw new Error('employees API unavailable')
    const json = await res.json()
    return json.employees || []
  } catch (err) {
    return []
  }
}

export async function addEmployee(data: { name: string; email: string; department?: string; employee_id?: string }): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/employees/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await res.json()
  } catch (err) {
    return { error: 'Failed to connect to API' }
  }
}

export async function updateEmployee(data: any): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/employees/update'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await res.json()
  } catch (err) {
    return { error: 'Failed to connect to API' }
  }
}

export async function downloadExtension(): Promise<void> {
  window.location.href = apiUrl('/api/extension/download')
}

export async function sendEmployeeSimulation(user_id: string, scenario?: string): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/employees/send-simulation'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, scenario }),
    })
    return await res.json()
  } catch (err) {
    return { error: 'Failed to connect to simulation API' }
  }
}

export async function sendWarningEmail(user_id: string, message?: string): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/alerts/warning-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, message }),
    })
    return await res.json()
  } catch (err) {
    return { error: 'Failed to connect to alert API' }
  }
}

export async function triggerPipelineRun(): Promise<PipelineRunResult> {
  try {
    const res = await fetch(apiUrl('/api/pipeline/run'), { method: 'POST' })
    return await res.json()
  } catch (err) {
    return { status: 'error', message: 'Failed to connect to pipeline API' }
  }
}

export async function fetchDashboardData(): Promise<DashboardData | null> {
  try {
    const res = await fetch(apiUrl('/api/dashboard'))
    if (!res.ok) throw new Error('dashboard unavailable')
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchLoginBehavior(user_id: string): Promise<LoginBehaviorEvent[]> {
  try {
    const res = await fetch(apiUrl(`/api/employees/${user_id}/login-behavior`))
    if (!res.ok) throw new Error('login behavior unavailable')
    const json = await res.json()
    return json.events || []
  } catch (err) {
    return []
  }
}

export async function fetchRiskHistory(user_id: string, days: number = 30): Promise<RiskHistoryEntry[]> {
  try {
    const res = await fetch(apiUrl(`/api/employees/${user_id}/risk-history?days=${days}`))
    if (!res.ok) throw new Error('risk history unavailable')
    const json = await res.json()
    return json.history || []
  } catch (err) {
    return []
  }
}

// ============ EMAIL FUNCTIONS ============

export async function generatePhishingEmail(
  user_id: string, scenario: string, context?: string
): Promise<GeneratedEmail | null> {
  try {
    // 20 second timeout for email generation
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch(apiUrl('/api/generate-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, scenario, context: context || '' }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`email generation failed: ${res.status}`)
      return await res.json()
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Email generation request timed out')
    } else {
      console.error('Email generation error:', err)
    }
    return null
  }
}

export async function generatePhishingEmailGemini(
  user_id: string, scenario: string, context?: string, useGemini: boolean = true
): Promise<GeneratedEmail | null> {
  try {
    const res = await fetch(apiUrl('/api/generate-email-gemini'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, scenario, context: context || '', use_gemini: useGemini }),
    })
    if (!res.ok) throw new Error('gemini email generation failed')
    return await res.json()
  } catch (err) {
    // Fallback to regular generation if Gemini is unavailable
    return generatePhishingEmail(user_id, scenario, context)
  }
}

export async function sendPhishingEmail(
  user_id: string,
  recipient_email?: string,
  scenario?: string,
  context?: string,
  custom_subject?: string,
  custom_body_text?: string,
  custom_body_html?: string,
): Promise<EmailSendResult | null> {
  try {
    const res = await fetch(apiUrl('/api/email/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        recipient_email,
        scenario,
        context,
        custom_subject,
        custom_body_text,
        custom_body_html
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      return { ...err, sent: false, mode: 'error' } as any
    }
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function sendAutoEmails(threshold?: number): Promise<{
  threshold: number; total_eligible: number; emails_sent: number;
  skipped: any[]; results: EmailSendResult[]
} | null> {
  try {
    const res = await fetch(apiUrl('/api/email/send-auto'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(threshold ? { threshold } : {}),
    })
    if (!res.ok) throw new Error('auto-send failed')
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchEmailLog(user_id?: string): Promise<{
  emails: EmailLogEntry[]; count: number; stats: EmailStats
} | null> {
  try {
    const query = user_id ? `?user_id=${user_id}` : ''
    const res = await fetch(apiUrl(`/api/email/log${query}`))
    if (!res.ok) throw new Error('email log unavailable')
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchTrainingStatus(user_id?: string): Promise<{
  sessions: TrainingSession[]; stats: TrainingStats;
  user_summary: Array<{ user_id: string; total: number; completed: number; pending: number; has_pending: boolean }>
} | null> {
  try {
    const path = user_id ? `/api/training/status/${user_id}` : '/api/training/status'
    const res = await fetch(apiUrl(path))
    if (!res.ok) throw new Error('training status unavailable')
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function triggerTraining(user_id: string, training_type: string = 'micro'): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/training/trigger'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, training_type }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function completeTraining(user_id: string): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/training/complete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, score: 100 }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchEmailScenarios(): Promise<Record<string, string[]> | null> {
  try {
    const res = await fetch(apiUrl('/api/email/scenarios'))
    if (!res.ok) throw new Error('scenarios unavailable')
    const json = await res.json()
    return json.scenarios
  } catch (err) {
    return null
  }
}

// Legacy functions for backward compatibility
export async function generateEmail(theme: string): Promise<{ subject: string; body: string; target_behavior: string; risk_score: number }> {
  return {
    subject: `Simulated ${theme} Email`,
    body: 'This email was generated by the adaptive phishing engine.',
    target_behavior: theme,
    risk_score: 0.6,
  }
}

export async function fetchPipeline(): Promise<{ stage: string; count: number }[]> {
  try {
    const logData = await fetchEmailLog()
    if (logData && logData.stats) {
      const s = logData.stats
      return [
        { stage: 'Sent', count: s.total_sent },
        { stage: 'Opened', count: s.total_opened },
        { stage: 'Clicked', count: s.total_clicked },
        { stage: 'Reported', count: s.total_reported },
      ]
    }
  } catch (e) { }
  return [
    { stage: 'Sent', count: 0 },
    { stage: 'Opened', count: 0 },
    { stage: 'Clicked', count: 0 },
    { stage: 'Reported', count: 0 },
  ]
}

export async function fetchMicroTrainingForRisk(riskScore: number) {
  try {
    const res = await fetch(apiUrl('/api/training-status'))
    if (!res.ok) throw new Error('no api')
    const json = await res.json()
    return {
      threshold: 0.66,
      why: 'See training status from backend',
      advice: 'Follow the recommended micro or mandatory training.',
      videoId: 'dQw4w9WgXcQ',
      raw: json.data
    }
  } catch (err) {
    return {
      threshold: 0.66,
      why: 'Training data unavailable.',
      advice: 'Follow the recommended training.',
      videoId: 'dQw4w9WgXcQ'
    }
  }
}

// ============ USER STATE FUNCTIONS ============

export type UserStateEntry = {
  user_id: string
  current_state: string
  updated_at: string
  created_at: string
}

export type StateDistribution = Record<string, number>

export type SchedulerStatus = {
  running: boolean
  last_event_count: number
  thread_alive: boolean
}

export async function fetchUserStates(): Promise<{
  states: UserStateEntry[]; distribution: StateDistribution; total_users: number
} | null> {
  try {
    const res = await fetch(apiUrl('/api/user-states'))
    if (!res.ok) throw new Error('user-states unavailable')
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function startAutoPipeline(interval_minutes: number = 5): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/pipeline/auto-start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval_minutes }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function stopAutoPipeline(): Promise<any> {
  try {
    const res = await fetch(apiUrl('/api/pipeline/auto-stop'), { method: 'POST' })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchSchedulerStatus(): Promise<SchedulerStatus | null> {
  try {
    const res = await fetch(apiUrl('/api/pipeline/scheduler-status'))
    if (!res.ok) throw new Error('scheduler status unavailable')
    return await res.json()
  } catch (err) {
    return null
  }
}
