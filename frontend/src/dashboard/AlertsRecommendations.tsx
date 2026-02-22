import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardData, type DashboardAlert, type DashboardRecommendation } from '../api/client'

const AlertsRecommendations: React.FC = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [recommendations, setRecommendations] = useState<DashboardRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [riskStats, setRiskStats] = useState({ high: 0, medium: 0, low: 0 })

  useEffect(() => {
    fetchDashboardData().then(data => {
      if (data) {
        setAlerts(data.alerts)
        setRecommendations(data.recommendations)
        setRiskStats(data.risk_distribution)
      }
      setLoading(false)
    })
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-900/30', border: 'border-red-700/50', icon: '🔴', badge: 'bg-red-600' }
      case 'high':
        return { bg: 'bg-orange-900/30', border: 'border-orange-700/50', icon: '🟠', badge: 'bg-orange-600' }
      case 'medium':
        return { bg: 'bg-yellow-900/30', border: 'border-yellow-700/50', icon: '🟡', badge: 'bg-yellow-600' }
      case 'low':
        return { bg: 'bg-blue-900/30', border: 'border-blue-700/50', icon: '🔵', badge: 'bg-blue-600' }
      default:
        return { bg: 'bg-gray-900/30', border: 'border-gray-700/50', icon: '⚪', badge: 'bg-gray-600' }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-300 bg-red-900/20 border-red-700/50'
      case 'high':
        return 'text-orange-300 bg-orange-900/20 border-orange-700/50'
      case 'medium':
        return 'text-yellow-300 bg-yellow-900/20 border-yellow-700/50'
      default:
        return 'text-gray-300 bg-gray-900/20 border-gray-700/50'
    }
  }

  const totalUsers = riskStats.high + riskStats.medium + riskStats.low
  const safePercent = totalUsers > 0 ? Math.round((riskStats.low / totalUsers) * 100) : 0

  return (
    <div className="space-y-12">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
          Alerts & Recommendations
        </h2>
        <p className="text-gray-400 text-lg">Auto-generated from real pipeline analysis results</p>
      </motion.div>

      {/* Alerts */}
      <div className="space-y-6">
        <motion.h3
          className="text-2xl font-bold text-white flex items-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
        >
          <span className="text-orange-400">⚠️</span> Active Alerts
        </motion.h3>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <motion.div className="p-4 rounded-lg bg-green-900/30 border border-green-700/50 text-green-300 text-center">
              <p className="font-semibold">✓ No active alerts — all clear</p>
            </motion.div>
          ) : (
            alerts.map((alert, idx) => {
              const alertKey = `${alert.severity}-${idx}`
              if (dismissedAlerts.has(alertKey)) return null
              const colors = getSeverityColor(alert.severity)
              return (
                <motion.div
                  key={alertKey}
                  className={`p-4 rounded-lg border transition-all backdrop-blur-sm group ${colors.bg} ${colors.border}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  whileHover={{ translateX: 8 }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <motion.div
                          className="text-2xl mt-0.5 flex-shrink-0"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {colors.icon}
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg">{alert.title}</h4>
                          <p className="text-sm text-gray-300 mt-1">{alert.description}</p>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => setDismissedAlerts(prev => new Set([...prev, alertKey]))}
                        className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ✕
                      </motion.button>
                    </div>

                    {alert.action && (
                      <motion.button
                        className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${alert.severity === 'high'
                            ? 'bg-orange-600/50 text-orange-200 hover:bg-orange-600/70'
                            : alert.severity === 'medium'
                              ? 'bg-yellow-600/50 text-yellow-200 hover:bg-yellow-600/70'
                              : 'bg-blue-600/50 text-blue-200 hover:bg-blue-600/70'
                          }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        → {alert.action}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}

          {alerts.filter((_, idx) => !dismissedAlerts.has(`${alerts[idx].severity}-${idx}`)).length === 0 && alerts.length > 0 && (
            <motion.div className="p-4 rounded-lg bg-green-900/30 border border-green-700/50 text-green-300 text-center">
              <p className="font-semibold">✓ All alerts dismissed</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        <motion.h3
          className="text-2xl font-bold text-white flex items-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
        >
          <span className="text-cyan-400">💡</span> Recommendations
        </motion.h3>

        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No recommendations at this time.</div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                className={`p-4 rounded-lg border transition-all backdrop-blur-sm group hover:shadow-lg hover:shadow-cyan-500/10 ${getPriorityColor(rec.priority)}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                whileHover={{ translateX: 8 }}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-base">{rec.title}</h4>
                    </div>
                    <motion.div
                      className="text-2xl flex-shrink-0"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      🎯
                    </motion.div>
                  </div>

                  <p className="text-sm text-gray-300">{rec.description}</p>

                  <div className="pt-2 border-t border-gray-600/30">
                    <p className="text-xs text-gray-400">
                      <span className="font-semibold text-cyan-300">Expected Impact:</span> {rec.impact}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <motion.div
        className="p-6 rounded-xl bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-cyan-900/20 border border-purple-700/30"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-3">
          <p className="text-lg font-semibold text-white">📈 Overall Assessment</p>
          <p className="text-gray-300">
            {totalUsers > 0 ? (
              <>
                Your organization has <span className="text-white font-semibold">{totalUsers}</span> monitored users.{' '}
                <span className="text-cyan-300 font-semibold">{safePercent}%</span> show normal behavior patterns.
                {riskStats.high > 0 && (
                  <> Focus on the <span className="text-red-300 font-semibold">{riskStats.high}</span> high-risk user(s) requiring immediate attention.</>
                )}
              </>
            ) : (
              <>No user data available yet. Deploy the collector and run the pipeline to get an assessment.</>
            )}
          </p>
          {totalUsers > 0 && (
            <div className="pt-2 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{riskStats.low}</div>
                <p className="text-xs text-gray-400">Safe Users</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{riskStats.medium}</div>
                <p className="text-xs text-gray-400">Watchlist</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{riskStats.high}</div>
                <p className="text-xs text-gray-400">High Risk</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AlertsRecommendations
