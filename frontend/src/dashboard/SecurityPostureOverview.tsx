import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardData, type DashboardData } from '../api/client'

interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  isHighlight?: boolean
  icon?: React.ReactNode
}

/**
 * Floating metric card with subtle hover lift.
 * Infinite boxShadow pulse removed for performance.
 */
const FloatingMetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  isHighlight,
  icon,
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 group hover:shadow-2xl hover:shadow-cyan-500/20 ${isHighlight
        ? 'bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-slate-900/40 border border-cyan-500/30'
        : 'bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 border border-slate-700/40'
        }`}
      whileHover={{ translateY: -8, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isHighlight ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5' : ''
          }`}
      />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-300 uppercase tracking-wide">{label}</p>
          {icon && <div className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>}
        </div>

        <div
          className={`text-4xl font-bold ${isHighlight ? 'text-cyan-300' : 'text-white'}`}
        >
          {value}
        </div>

        {change && (
          <p
            className={`text-xs font-semibold ${change.startsWith('+') ? 'text-green-400' : change.startsWith('-') ? 'text-red-400' : 'text-gray-400'
              }`}
          >
            {change}
          </p>
        )}
      </div>

      {/* Highlight border on hover — static, no infinite pulse */}
      {isHighlight && (
        <div className="absolute inset-0 rounded-2xl border border-cyan-400/0 group-hover:border-cyan-400/30 transition-all duration-300" />
      )}
    </motion.div>
  )
}

const SecurityPostureOverview: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData().then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const posture = data?.posture
  const riskLevel = posture?.overall_risk_level || 'Unknown'

  const metrics = [
    {
      label: 'Overall Risk Level',
      value: loading ? '...' : riskLevel,
      isHighlight: true,
      change: posture ? `Avg: ${(posture.avg_risk_score * 100).toFixed(0)}%` : '',
      icon: '🛡️',
    },
    {
      label: 'Users Monitored',
      value: loading ? '...' : posture?.total_users ?? 0,
      change: posture?.total_events_collected ? `${posture.total_events_collected} events collected` : 'No events yet',
      icon: '👥',
    },
    {
      label: 'Events Collected',
      value: loading ? '...' : posture?.total_events_collected ?? 0,
      change: posture?.last_pipeline_run ? `Last run: ${new Date(posture.last_pipeline_run).toLocaleTimeString()}` : 'Pipeline not run',
      icon: '📊',
    },
    {
      label: 'Training Pending',
      value: loading ? '...' : posture?.training_pending ?? 0,
      change: posture?.training_pending ? `${posture.training_pending} user(s) need training` : 'All clear',
      icon: '📚',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
          Security Posture Overview
        </h2>
        <p className="text-gray-400 text-lg">
          Real-time organizational security metrics from live behavioral data
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <FloatingMetricCard
            key={idx}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            isHighlight={metric.isHighlight}
            icon={metric.icon}
          />
        ))}
      </div>

      <motion.div
        className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-start gap-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-2xl">ℹ️</div>
        <div>
          <p className="text-sm text-gray-300">
            {data && data.posture.total_users > 0 ? (
              <>
                <span className="font-semibold text-cyan-300">Live Data:</span> Metrics are derived from{' '}
                <span className="text-white font-semibold">{data.posture.total_events_collected}</span> behavioral events
                across <span className="text-white font-semibold">{data.posture.total_users}</span> monitored users.
                {data.scheduler_status?.running
                  ? <span className="ml-2 text-green-400 font-semibold">🟢 Auto-pipeline active</span>
                  : <span className="ml-2 text-gray-500">⏸ Auto-pipeline stopped</span>
                }
              </>
            ) : (
              <>
                <span className="font-semibold text-cyan-300">Getting Started:</span> Deploy the behavioral collector to
                internal pages and run the pipeline to see real data here.
              </>
            )}
          </p>
        </div>
      </motion.div>

      {/* User State Distribution */}
      {data?.state_distribution && Object.values(data.state_distribution).some(v => v > 0) && (
        <motion.div
          className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm font-semibold text-gray-300 mb-3">User Training States</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'CLEAN', label: 'Clean', color: 'bg-gray-600', text: 'text-gray-200' },
              { key: 'PHISH_SENT', label: 'Phish Sent', color: 'bg-blue-600', text: 'text-blue-200' },
              { key: 'PHISH_CLICKED', label: 'Clicked', color: 'bg-red-600', text: 'text-red-200' },
              { key: 'MICRO_TRAINING_REQUIRED', label: 'Micro Training', color: 'bg-orange-600', text: 'text-orange-200' },
              { key: 'MICRO_TRAINING_COMPLETED', label: 'Micro Done', color: 'bg-amber-600', text: 'text-amber-200' },
              { key: 'MANDATORY_TRAINING_REQUIRED', label: 'Mandatory', color: 'bg-yellow-600', text: 'text-yellow-200' },
              { key: 'COMPLIANT', label: 'Compliant', color: 'bg-green-600', text: 'text-green-200' },
            ].filter(s => (data.state_distribution?.[s.key] ?? 0) > 0).map(s => (
              <div key={s.key} className={`${s.color}/20 border border-white/10 rounded-lg px-3 py-2 text-center`}>
                <div className={`text-lg font-bold ${s.text}`}>{data.state_distribution?.[s.key] ?? 0}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default SecurityPostureOverview
