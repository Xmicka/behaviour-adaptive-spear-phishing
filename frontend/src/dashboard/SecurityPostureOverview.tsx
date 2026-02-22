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
      animate={{ opacity: 1, y: 0 }}
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

        <motion.div
          className={`text-4xl font-bold ${isHighlight ? 'text-cyan-300' : 'text-white'
            }`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {value}
        </motion.div>

        {change && (
          <p
            className={`text-xs font-semibold ${change.startsWith('+') ? 'text-green-400' : change.startsWith('-') ? 'text-red-400' : 'text-gray-400'
              }`}
          >
            {change}
          </p>
        )}
      </div>

      {isHighlight && (
        <motion.div
          className="absolute inset-0 rounded-2xl border border-cyan-400/0 group-hover:border-cyan-400/30 transition-all duration-300"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(34, 211, 238, 0)',
              '0 0 0 8px rgba(34, 211, 238, 0.1)',
              '0 0 0 0 rgba(34, 211, 238, 0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
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
  const riskColor = riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'

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
        viewport={{ once: false }}
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
        viewport={{ once: false }}
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
                Run the pipeline to refresh risk scores.
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
    </div>
  )
}

export default SecurityPostureOverview
