import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    fetchCollectorStats,
    fetchEvents,
    triggerPipelineRun,
    type CollectorStats,
    type CollectorEvent,
    type PipelineRunResult,
} from '../api/client'

// ── Utility ──────────────────────────────────────────────────────

function timeAgo(isoString: string | null): string {
    if (!isoString) return 'Never'
    const diff = Date.now() - new Date(isoString).getTime()
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
}

function statusColor(status: string): string {
    if (status === 'completed') return '#22c55e'
    if (status === 'running') return '#eab308'
    if (status === 'failed') return '#ef4444'
    return '#6b7280'
}

// ── Metric Card ──────────────────────────────────────────────────

const MetricCard: React.FC<{
    label: string
    value: string | number
    icon: string
    accent?: string
}> = ({ label, value, icon, accent = '#00d9ff' }) => (
    <motion.div
        className="relative overflow-hidden rounded-xl border border-white/5"
        style={{ background: 'rgba(20, 20, 30, 0.7)', backdropFilter: 'blur(10px)' }}
        whileHover={{ scale: 1.03, translateY: -2 }}
        transition={{ duration: 0.2 }}
    >
        <div className="p-5">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-3xl font-bold" style={{ color: accent }}>
                {value}
            </div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
        </div>
        <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
    </motion.div>
)

// ── Event Type Badge ─────────────────────────────────────────────

const EventTypeBadge: React.FC<{ type: string; count: number }> = ({ type, count }) => {
    const colors: Record<string, string> = {
        page_view: '#3b82f6',
        click: '#22c55e',
        typing_cadence: '#eab308',
        navigation: '#8b5cf6',
        session_start: '#06b6d4',
        session_end: '#6b7280',
        focus_heartbeat: '#14b8a6',
        focus_lost: '#f97316',
        focus_gained: '#10b981',
        copy_event: '#ef4444',
        paste_event: '#f43f5e',
    }
    const color = colors[type] || '#6b7280'

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
        >
            <span>{type.replace(/_/g, ' ')}</span>
            <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: `${color}30` }}
            >
                {count}
            </span>
        </div>
    )
}

// ── Live Event Row ───────────────────────────────────────────────

const EventRow: React.FC<{ event: CollectorEvent; index: number }> = ({ event, index }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
    >
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300">{event.event_type}</span>
                <span className="text-xs text-gray-500">{event.page_url || '—'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
                <span className="text-gray-400">{event.user_id}</span>
                <span className="mx-1">·</span>
                <span>{timeAgo(event.timestamp)}</span>
            </div>
        </div>
    </motion.div>
)

// ── Integration Snippet ──────────────────────────────────────────

const IntegrationSnippet: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
    const snippet = `<!-- Behavioral Data Collector -->
<script src="http://localhost:8000/api/collector/script.js"
        data-endpoint="http://localhost:8000/api/collect"
        data-user-id="EMPLOYEE_ID"
        data-api-key="YOUR_API_KEY">
</script>`

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div
                        className="mt-4 rounded-xl p-5 border border-white/10"
                        style={{ background: 'rgba(20, 20, 30, 0.8)' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">📋 Integration Snippet</h4>
                            <button
                                onClick={onClose}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Add this script tag to internal pages to start collecting behavioral data.
                            Replace <code className="text-cyan-300">EMPLOYEE_ID</code> with the user's identifier
                            and <code className="text-cyan-300">YOUR_API_KEY</code> with your configured key.
                        </p>
                        <pre
                            className="text-xs font-mono p-4 rounded-lg overflow-x-auto"
                            style={{ background: 'rgba(0,0,0,0.5)', color: '#a5f3fc' }}
                        >
                            {snippet}
                        </pre>
                        <button
                            onClick={() => navigator.clipboard.writeText(snippet)}
                            className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 transition-colors"
                        >
                            📋 Copy to clipboard
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// ── Main Component ───────────────────────────────────────────────

const DataCollection: React.FC = () => {
    const [stats, setStats] = useState<CollectorStats | null>(null)
    const [events, setEvents] = useState<CollectorEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [pipelineResult, setPipelineResult] = useState<PipelineRunResult | null>(null)
    const [runningPipeline, setRunningPipeline] = useState(false)
    const [showSnippet, setShowSnippet] = useState(false)
    const [showEvents, setShowEvents] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const loadData = useCallback(async () => {
        const [statsData, eventsData] = await Promise.all([
            fetchCollectorStats(),
            fetchEvents({ limit: 30 }),
        ])
        setStats(statsData)
        setEvents(eventsData.data)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Auto-refresh every 15 seconds
    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(loadData, 15000)
        return () => clearInterval(interval)
    }, [autoRefresh, loadData])

    const handlePipelineRun = async () => {
        setRunningPipeline(true)
        setPipelineResult(null)
        const result = await triggerPipelineRun()
        setPipelineResult(result)
        setRunningPipeline(false)
        // Refresh data after pipeline run
        loadData()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
            </div>
        )
    }

    const hasData = (stats?.total_events ?? 0) > 0

    return (
        <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">📡</span> Live Data Collection
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Real-time behavioral event ingestion for adaptive risk analysis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${autoRefresh
                                ? 'bg-green-600/20 border-green-500/30 text-green-300'
                                : 'bg-gray-600/20 border-gray-500/30 text-gray-400'
                            }`}
                    >
                        {autoRefresh ? '🟢 Auto-refresh ON' : '⏸ Auto-refresh OFF'}
                    </button>
                    <button
                        onClick={() => setShowSnippet(!showSnippet)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 transition-all"
                    >
                        {'</>'} Integration Guide
                    </button>
                </div>
            </div>

            {/* Integration snippet */}
            <IntegrationSnippet show={showSnippet} onClose={() => setShowSnippet(false)} />

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <MetricCard
                    icon="📊"
                    label="Total Events"
                    value={stats?.total_events?.toLocaleString() ?? '0'}
                    accent="#00d9ff"
                />
                <MetricCard
                    icon="👥"
                    label="Unique Users"
                    value={stats?.unique_users ?? 0}
                    accent="#8b5cf6"
                />
                <MetricCard
                    icon="🔄"
                    label="Sessions"
                    value={stats?.unique_sessions ?? 0}
                    accent="#22c55e"
                />
                <MetricCard
                    icon="⏱"
                    label="Last Event"
                    value={timeAgo(stats?.last_event_at ?? null)}
                    accent={hasData ? '#22c55e' : '#6b7280'}
                />
            </div>

            {/* Event Type Breakdown */}
            {hasData && stats?.event_types && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 rounded-xl border border-white/5 p-5"
                    style={{ background: 'rgba(20, 20, 30, 0.7)' }}
                >
                    <h3 className="text-sm font-semibold text-white mb-3">Event Types</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.event_types).map(([type, count]) => (
                            <EventTypeBadge key={type} type={type} count={count} />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Pipeline Control */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 rounded-xl border border-white/5 p-5"
                style={{ background: 'rgba(20, 20, 30, 0.7)' }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">🔬 Anomaly Detection Pipeline</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Process collected behavioral data through Isolation Forest to compute risk scores
                        </p>
                    </div>
                    <button
                        onClick={handlePipelineRun}
                        disabled={runningPipeline || !hasData}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${runningPipeline
                                ? 'bg-yellow-600/20 text-yellow-300 cursor-wait'
                                : !hasData
                                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5'
                            }`}
                    >
                        {runningPipeline ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⚙️</span> Running...
                            </span>
                        ) : (
                            '▶ Run Pipeline'
                        )}
                    </button>
                </div>

                {/* Pipeline result */}
                <AnimatePresence>
                    {pipelineResult && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 rounded-lg p-4 border"
                            style={{
                                background:
                                    pipelineResult.status === 'completed'
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : 'rgba(239, 68, 68, 0.1)',
                                borderColor:
                                    pipelineResult.status === 'completed'
                                        ? 'rgba(34, 197, 94, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)',
                            }}
                        >
                            <div className="text-sm font-medium" style={{
                                color: pipelineResult.status === 'completed' ? '#22c55e' : '#ef4444'
                            }}>
                                {pipelineResult.status === 'completed' ? '✅ Pipeline completed' : `❌ ${pipelineResult.message || 'Pipeline failed'}`}
                            </div>
                            {pipelineResult.status === 'completed' && (
                                <div className="text-xs text-gray-400 mt-2 space-y-1">
                                    <div>Events processed: <span className="text-white">{pipelineResult.events_processed}</span></div>
                                    <div>Users analyzed: <span className="text-white">{pipelineResult.users_analyzed}</span></div>
                                    <div>High-risk users: <span className="text-red-400">{pipelineResult.high_risk_users}</span></div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recent pipeline runs */}
                {stats?.recent_pipeline_runs && stats.recent_pipeline_runs.length > 0 && (
                    <div className="mt-4 border-t border-white/5 pt-4">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Runs</h4>
                        <div className="space-y-2">
                            {stats.recent_pipeline_runs.slice(0, 3).map((run) => (
                                <div
                                    key={run.id}
                                    className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/5"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ background: statusColor(run.status) }}
                                        />
                                        <span className="text-gray-300">{run.status}</span>
                                    </div>
                                    <div className="text-gray-500">
                                        {run.user_count} users · {run.event_count} events ·{' '}
                                        {timeAgo(run.started_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Live Event Feed */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 rounded-xl border border-white/5 overflow-hidden"
                style={{ background: 'rgba(20, 20, 30, 0.7)' }}
            >
                <button
                    onClick={() => setShowEvents(!showEvents)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                >
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>📋</span> Live Event Feed
                        <span className="text-xs font-normal text-gray-500">
                            ({events.length} recent events)
                        </span>
                    </h3>
                    <motion.span
                        animate={{ rotate: showEvents ? 180 : 0 }}
                        className="text-gray-500"
                    >
                        ▼
                    </motion.span>
                </button>

                <AnimatePresence>
                    {showEvents && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="border-t border-white/5 max-h-[400px] overflow-y-auto">
                                {events.length > 0 ? (
                                    events.map((evt, i) => <EventRow key={evt.id} event={evt} index={i} />)
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        <div className="text-3xl mb-2">📭</div>
                                        No events collected yet. Embed the collector script to start gathering data.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Empty state guide */}
            {!hasData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 rounded-xl border border-cyan-500/20 p-6 text-center"
                    style={{ background: 'rgba(0, 217, 255, 0.05)' }}
                >
                    <div className="text-3xl mb-3">🚀</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Get Started with Data Collection</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
                        Embed the lightweight collector script in your internal pages to start tracking
                        behavioral patterns. No PII is captured — only navigation patterns, click behavior,
                        and session timings.
                    </p>
                    <button
                        onClick={() => setShowSnippet(true)}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        View Integration Guide
                    </button>
                </motion.div>
            )}
        </div>
    )
}

export default DataCollection
