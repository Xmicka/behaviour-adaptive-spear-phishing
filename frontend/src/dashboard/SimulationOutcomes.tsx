import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardData, type DashboardUser } from '../api/client'

const SimulationOutcomes: React.FC = () => {
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [filterTier, setFilterTier] = useState<'all' | 'High' | 'Medium' | 'Low'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData().then(data => {
      if (data) setUsers(data.users)
      setLoading(false)
    })
  }, [])

  const filteredUsers = filterTier === 'all' ? users : users.filter(u => u.tier === filterTier)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'High':
        return { bg: 'bg-red-900/20', border: 'border-red-700/50', text: 'text-red-300', badge: 'bg-red-500' }
      case 'Medium':
        return { bg: 'bg-yellow-900/20', border: 'border-yellow-700/50', text: 'text-yellow-300', badge: 'bg-yellow-500' }
      case 'Low':
        return { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-300', badge: 'bg-green-500' }
      default:
        return { bg: 'bg-gray-900/20', border: 'border-gray-700/50', text: 'text-gray-300', badge: 'bg-gray-500' }
    }
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 0.6) return 'bg-red-500/80'
    if (score >= 0.3) return 'bg-yellow-500/80'
    return 'bg-green-500/80'
  }

  const stats = {
    high: users.filter(u => u.tier === 'High').length,
    medium: users.filter(u => u.tier === 'Medium').length,
    low: users.filter(u => u.tier === 'Low').length,
  }

  return (
    <div className="space-y-8">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
          User Risk Profiles
        </h2>
        <p className="text-gray-400 text-lg">Risk scores computed by Isolation Forest from live behavioral data</p>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {[
          { label: 'High Risk', value: stats.high, color: 'text-red-400' },
          { label: 'Watchlist', value: stats.medium, color: 'text-yellow-400' },
          { label: 'Safe', value: stats.low, color: 'text-green-400' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center"
            whileHover={{ translateY: -4 }}
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{loading ? '...' : stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {(['all', 'High', 'Medium', 'Low'] as const).map(tier => (
          <motion.button
            key={tier}
            onClick={() => setFilterTier(tier)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filterTier === tier
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-gray-300 border border-slate-700 hover:border-cyan-600/50'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tier === 'all' ? 'All' : tier}
          </motion.button>
        ))}
      </motion.div>

      <motion.div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-3xl mb-2">📭</div>
            No user data available. Run the pipeline after collecting behavioral events.
          </div>
        ) : (
          filteredUsers.map((user, idx) => {
            const colors = getTierColor(user.tier)
            return (
              <motion.div
                key={user.user_id}
                className={`group p-4 rounded-lg border transition-all backdrop-blur-sm hover:shadow-lg ${colors.bg} ${colors.border}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                whileHover={{ translateX: 8 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.user_id.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.user_id}</p>
                        <p className="text-xs text-gray-400">{user.login_count} login events</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className={`w-3 h-3 rounded-full ${colors.badge}`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className={`capitalize font-semibold text-sm ${colors.text}`}>
                        {user.tier}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <span className="text-xs text-gray-400 line-clamp-2">{user.risk_reason || 'Analyzed'}</span>
                  </div>

                  <div className="md:col-span-1 text-right">
                    <motion.div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${getRiskBadgeColor(
                        user.risk_score
                      )} text-white text-sm font-semibold`}
                    >
                      {(user.risk_score * 100).toFixed(0)}%
                    </motion.div>
                  </div>

                  <div className="md:col-span-1 text-right">
                    <p className="text-xs text-gray-400">Failed: {(user.failed_login_ratio * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </motion.div>

      <motion.div
        className="p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-cyan-200">
          <span className="font-semibold">📊 Live Data:</span>{' '}
          {users.length > 0
            ? `${stats.low} users show normal patterns. ${stats.high} user(s) require immediate attention.`
            : 'Awaiting pipeline execution to generate risk profiles.'}
        </p>
      </motion.div>
    </div>
  )
}

export default SimulationOutcomes
