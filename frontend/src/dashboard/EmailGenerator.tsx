import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    fetchDashboardData,
    generatePhishingEmail,
    sendPhishingEmail,
    type DashboardUser,
    type GeneratedEmail,
} from '../api/client'

const DEFAULT_SCENARIOS = [
    'Urgent Action (Wire Transfer/Payroll)',
    'Security Alert Verification',
    'Admin Panel Password Reset',
    'VPN Access Reauthentication',
    'Cloud Storage Permission Update',
]

const CONTEXTS = [
    '',
    'finance department',
    'HR team',
    'IT security',
    'executive office',
    'engineering team',
]

const EmailGenerator: React.FC = () => {
    const [users, setUsers] = useState<DashboardUser[]>([])
    const [scenarios, setScenarios] = useState<string[]>(DEFAULT_SCENARIOS)
    const [selectedUser, setSelectedUser] = useState('')
    const [scenario, setScenario] = useState('')
    const [customScenario, setCustomScenario] = useState('')
    const [context, setContext] = useState('')
    const [result, setResult] = useState<GeneratedEmail | null>(null)
    const [generating, setGenerating] = useState(false)
    const [sending, setSending] = useState(false)
    const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch dashboard data (users)
                const dashboardData = await fetchDashboardData()
                if (dashboardData?.users) {
                    setUsers(dashboardData.users)
                    if (dashboardData.users.length > 0) setSelectedUser(dashboardData.users[0].user_id)
                }

                // Fetch scenarios from API
                try {
                    const response = await fetch('/api/email/scenarios')
                    if (response.ok) {
                        const data = await response.json()
                        if (data?.scenarios && Array.isArray(data.scenarios)) {
                            setScenarios(data.scenarios)
                        }
                    } else {
                        console.warn('Failed to fetch scenarios, using defaults')
                        setScenarios(DEFAULT_SCENARIOS)
                    }
                } catch (err) {
                    console.error('Error fetching scenarios:', err)
                    setScenarios(DEFAULT_SCENARIOS)
                }
            } catch (err) {
                console.error('Error loading dashboard data:', err)
                setError('Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const handleGenerate = async () => {
        const finalScenario = customScenario || scenario || 'credential verification'
        if (!selectedUser) return

        setGenerating(true)
        setResult(null)
        setSendStatus(null)

        // Timeout after 15 seconds to prevent infinite loading
        const timeout = setTimeout(() => {
            setGenerating(false)
            setSendStatus({ 
                type: 'error', 
                msg: 'Email generation timed out. The API may be busy. Please try again.' 
            })
        }, 15000)

        try {
            const res = await generatePhishingEmail(selectedUser, finalScenario, context)
            clearTimeout(timeout)
            if (res) {
                setResult(res)
            } else {
                setSendStatus({ 
                    type: 'error', 
                    msg: 'Failed to generate email. Please check the backend logs.' 
                })
            }
        } catch (err) {
            clearTimeout(timeout)
            console.error('Email generation error:', err)
            setSendStatus({ 
                type: 'error', 
                msg: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
            })
        } finally {
            setGenerating(false)
        }
    }

    const handleSend = async () => {
        if (!selectedUser || !result) return

        setSending(true)
        setSendStatus(null)

        const finalScenario = customScenario || scenario || 'credential verification'

        const res = await sendPhishingEmail(
            selectedUser,
            "", // fallback to default routing
            finalScenario,
            context,
            result.email.subject,
            result.email.body,
            result.email.body_html || `<p>${result.email.body.replace(/\\n/g, '<br/>')}</p>`
        )

        if (res && res.sent) {
            setSendStatus({ type: 'success', msg: `Email sent successfully to user!` })
        } else {
            setSendStatus({ type: 'error', msg: res?.error || 'Failed to send email. Check logs.' })
        }

        setSending(false)
    }

    const selectedUserData = users.find(u => u.user_id === selectedUser)

    return (
        <div>
            {/* Error display */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-600 text-red-300 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🎯</span> Adaptive Email Generator
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Generate spear phishing emails tailored to real user behavioral profiles
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Panel */}
                <div
                    className="lg:col-span-1 rounded-xl border border-white/5 p-5 space-y-5"
                    style={{ background: 'rgba(20, 20, 30, 0.7)' }}
                >
                    <h3 className="text-sm font-semibold text-white mb-3">⚙️ Configuration</h3>

                    {/* User selector */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Target User</label>
                        {loading ? (
                            <div className="text-xs text-gray-500">Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="text-xs text-gray-500">No users available, run the pipeline first</div>
                        ) : (
                            <select
                                value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                                {users.map(u => (
                                    <option key={u.user_id} value={u.user_id}>
                                        {u.user_id} (Risk: {(u.risk_score * 100).toFixed(0)}%, {u.tier})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Scenario selector */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Scenario</label>
                        <select
                            value={scenario}
                            onChange={e => { setScenario(e.target.value); setCustomScenario('') }}
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="">Select a scenario...</option>
                            {scenarios.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                            <option value="__custom__">Custom scenario...</option>
                        </select>
                    </div>

                    {/* Custom scenario input */}
                    {(scenario === '__custom__' || (!scenario && !customScenario)) && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Custom Scenario</label>
                            <input
                                type="text"
                                value={customScenario}
                                onChange={e => setCustomScenario(e.target.value)}
                                placeholder="e.g. quarterly bonus notification"
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-500"
                            />
                        </div>
                    )}

                    {/* Context */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Context (optional)</label>
                        <select
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            {CONTEXTS.map(c => (
                                <option key={c} value={c}>{c || '(none)'}</option>
                            ))}
                        </select>
                    </div>

                    {/* User Profile Summary */}
                    {selectedUserData && (
                        <motion.div
                            className="rounded-lg p-3 border border-white/5"
                            style={{ background: 'rgba(0, 217, 255, 0.05)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h4 className="text-xs font-semibold text-cyan-300 mb-2">User Profile</h4>
                            <div className="space-y-1 text-xs text-gray-400">
                                <div className="flex justify-between">
                                    <span>Risk Score</span>
                                    <span className={`font-semibold ${selectedUserData.tier === 'High' ? 'text-red-300' :
                                        selectedUserData.tier === 'Medium' ? 'text-yellow-300' : 'text-green-300'
                                        }`}>{(selectedUserData.risk_score * 100).toFixed(0)}% ({selectedUserData.tier})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Login Events</span>
                                    <span className="text-white">{selectedUserData.login_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Failed Rate</span>
                                    <span className="text-white">{(selectedUserData.failed_login_ratio * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ML Anomaly</span>
                                    <span className="text-white">{(selectedUserData.ml_anomaly_score * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedUser}
                        className={`w-full px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${generating
                            ? 'bg-yellow-600/20 text-yellow-300 cursor-wait'
                            : !selectedUser
                                ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5'
                            }`}
                    >
                        {generating ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⚙️</span> Generating...
                            </span>
                        ) : (
                            '🎯 Generate Phishing Email'
                        )}
                    </button>
                </div>

                {/* Result Panel */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {sendStatus?.type === 'error' && !result ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="rounded-xl border border-red-600/50 p-8 text-center"
                                style={{ background: 'rgba(127, 29, 29, 0.2)' }}
                            >
                                <div className="text-5xl mb-4">⚠️</div>
                                <h3 className="text-lg font-semibold text-red-300 mb-2">Generation Failed</h3>
                                <p className="text-sm text-red-200 mb-4">{sendStatus.msg}</p>
                                <button
                                    onClick={() => { setResult(null); setSendStatus(null) }}
                                    className="px-4 py-2 rounded-lg bg-red-600/50 hover:bg-red-600/70 text-white text-sm font-semibold transition-colors"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        ) : result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                {/* Email Preview */}
                                <div
                                    className="rounded-xl border border-white/10 overflow-hidden"
                                    style={{ background: 'rgba(20, 20, 30, 0.8)' }}
                                >
                                    {/* Email header */}
                                    <div className="p-4 border-b border-white/5" style={{ background: 'rgba(30, 30, 45, 0.9)' }}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm">
                                                ✉️
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">{result.email.from_name}</div>
                                                <div className="text-xs text-gray-400">&lt;{result.email.from_email}&gt;</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-white font-semibold">
                                            Subject: <span className="text-red-300">{result.email.subject}</span>
                                        </div>
                                    </div>

                                    {/* Email body */}
                                    <div className="p-5">
                                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                            {result.email.body}
                                        </pre>
                                    </div>
                                </div>

                                {/* Adaptation Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Risk Factors */}
                                    <div
                                        className="rounded-xl border border-white/5 p-4"
                                        style={{ background: 'rgba(20, 20, 30, 0.7)' }}
                                    >
                                        <h4 className="text-xs font-semibold text-red-300 uppercase tracking-wide mb-3">
                                            🔍 Adaptation Factors
                                        </h4>
                                        <div className="space-y-2">
                                            {result.risk_factors.map((factor, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    <span>{factor}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Behavioral Profile */}
                                    <div
                                        className="rounded-xl border border-white/5 p-4"
                                        style={{ background: 'rgba(20, 20, 30, 0.7)' }}
                                    >
                                        <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wide mb-3">
                                            📊 Behavioral Profile
                                        </h4>
                                        <div className="space-y-1.5 text-xs text-gray-400">
                                            <div className="flex justify-between"><span>Events Analyzed</span><span className="text-white">{result.profile.total_events}</span></div>
                                            <div className="flex justify-between"><span>Sessions</span><span className="text-white">{result.profile.sessions}</span></div>
                                            <div className="flex justify-between"><span>Page Views</span><span className="text-white">{result.profile.total_page_views}</span></div>
                                            <div className="flex justify-between"><span>Clicks</span><span className="text-white">{result.profile.total_clicks}</span></div>
                                            <div className="flex justify-between"><span>Copy/Paste Events</span><span className="text-white">{result.profile.copy_paste_events}</span></div>
                                            {result.profile.avg_typing_speed_ms && (
                                                <div className="flex justify-between"><span>Avg Typing Speed</span><span className="text-white">{result.profile.avg_typing_speed_ms}ms</span></div>
                                            )}
                                            <div className="flex justify-between">
                                                <span>Personalization</span>
                                                <span className={`font-semibold ${result.adaptation_summary?.personalization_depth === 'deep' ? 'text-green-300' :
                                                    result.adaptation_summary?.personalization_depth === 'moderate' ? 'text-yellow-300' : 'text-gray-300'
                                                    }`}>{result.adaptation_summary?.personalization_depth || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Urgency</span>
                                                <span className={`font-semibold ${result.adaptation_summary?.urgency_level === 'high' ? 'text-red-300' :
                                                    result.adaptation_summary?.urgency_level === 'medium' ? 'text-yellow-300' : 'text-gray-300'
                                                    }`}>{result.adaptation_summary?.urgency_level || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Send Execution Panel */}
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/50">
                                    <div className="flex-1">
                                        {sendStatus && (
                                            <div className={`text-sm px-3 py-2 rounded-lg ${sendStatus.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                                {sendStatus.type === 'success' ? '✅ ' : '❌ '}
                                                {sendStatus.msg}
                                            </div>
                                        )}
                                        {!sendStatus && (
                                            <p className="text-sm text-gray-400">
                                                Review the generated email above. Click Send to dispatch this exact payload to the target employee.
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || sendStatus?.type === 'success'}
                                        className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 min-w-[140px] ${sendStatus?.type === 'success'
                                            ? 'bg-green-600/50 text-white cursor-not-allowed'
                                            : sending
                                                ? 'bg-cyan-600/50 text-cyan-200 cursor-wait'
                                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {sending ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                                                Sending...
                                            </span>
                                        ) : sendStatus?.type === 'success' ? (
                                            'Sent!'
                                        ) : (
                                            '📤 Send Email'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-xl border border-white/5 p-12 text-center"
                                style={{ background: 'rgba(20, 20, 30, 0.5)' }}
                            >
                                <div className="text-5xl mb-4">✉️</div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Generate an Adaptive Phishing Email
                                </h3>
                                <p className="text-sm text-gray-400 max-w-md mx-auto">
                                    Select a target user and scenario, then click "Generate" to create a spear phishing email
                                    that adapts to the user's actual behavioral patterns (typing speed, click behavior).
                                    pages visited, and risk profile.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default EmailGenerator
