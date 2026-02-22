import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardData, type TrainingEntry } from '../api/client'

const TrainingEnforcement: React.FC = () => {
  const [trainingData, setTrainingData] = useState<TrainingEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData().then(data => {
      if (data) setTrainingData(data.training)
      setLoading(false)
    })
  }, [])

  const stats = {
    totalPending: trainingData.filter(u => u.is_pending).length,
    microAssigned: trainingData.filter(u => u.training_action === 'MICRO').length,
    mandatoryAssigned: trainingData.filter(u => u.training_action === 'MANDATORY').length,
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'MANDATORY':
        return 'text-red-300 bg-red-900/30 border-red-700/50'
      case 'MICRO':
        return 'text-orange-300 bg-orange-900/30 border-orange-700/50'
      default:
        return 'text-green-300 bg-green-900/30 border-green-700/50'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'MANDATORY': return 'Mandatory Training'
      case 'MICRO': return 'Micro-Training'
      default: return 'No Training Needed'
    }
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
          Training Enforcement
        </h2>
        <p className="text-gray-400 text-lg">Automated training assignments based on risk scores</p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {[
          { label: 'Total Pending', value: loading ? '...' : stats.totalPending, icon: '⚠️', color: 'text-orange-300' },
          { label: 'Micro-Training', value: loading ? '...' : stats.microAssigned, icon: '📝', color: 'text-blue-300' },
          { label: 'Mandatory Training', value: loading ? '...' : stats.mandatoryAssigned, icon: '🔴', color: 'text-red-300' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-cyan-600/50 transition-colors"
            whileHover={{ translateY: -4 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
                <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="text-3xl opacity-50">{stat.icon}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading training data...</div>
        ) : trainingData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-3xl mb-2">📭</div>
            No training data available. Run the pipeline to generate training assignments.
          </div>
        ) : (
          trainingData.map((user, idx) => {
            const isExpanded = expandedId === user.user_id
            return (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
              >
                <motion.div
                  className={`p-4 rounded-lg border transition-all backdrop-blur-sm group cursor-pointer ${isExpanded
                      ? 'bg-blue-900/20 border-blue-700/50'
                      : 'bg-slate-800/20 border-slate-700/40 hover:border-cyan-600/50'
                    }`}
                  onClick={() => setExpandedId(isExpanded ? null : user.user_id)}
                  whileHover={{ translateX: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <motion.div
                        className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        animate={{ scale: isExpanded ? 1.1 : 1 }}
                      >
                        {user.user_id.substring(0, 2).toUpperCase()}
                      </motion.div>
                      <div>
                        <p className="font-semibold text-white">{user.user_id}</p>
                        <p className="text-xs text-gray-400">{getActionLabel(user.training_action)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getActionColor(user.training_action)}`}>
                        {user.training_action}
                      </span>

                      {user.is_pending && (
                        <motion.div
                          className="px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-600/50 text-orange-300 text-xs font-semibold"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Pending
                        </motion.div>
                      )}

                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="text-gray-400 group-hover:text-cyan-400 transition-colors"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                      >
                        <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, maxHeight: 0 }}
                    animate={{
                      opacity: isExpanded ? 1 : 0,
                      maxHeight: isExpanded ? 200 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                      {user.micro_training_url && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-300">Micro-Training URL</p>
                          <a href={user.micro_training_url} className="text-xs text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">
                            {user.micro_training_url}
                          </a>
                        </div>
                      )}
                      {user.mandatory_training_url && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-300">Mandatory Training URL</p>
                          <a href={user.mandatory_training_url} className="text-xs text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">
                            {user.mandatory_training_url}
                          </a>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        Status: {user.is_pending ? 'Training assigned, awaiting completion' : 'No training required at this time'}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
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
        <div className="space-y-2">
          <p className="text-sm font-semibold text-cyan-200">💡 Training Decisions:</p>
          <ul className="text-sm text-gray-300 space-y-1 ml-4">
            <li>• Training actions are automatically assigned based on pipeline risk scores</li>
            {stats.mandatoryAssigned > 0 && (
              <li>• {stats.mandatoryAssigned} user(s) require mandatory security training (risk ≥ 0.6)</li>
            )}
            {stats.microAssigned > 0 && (
              <li>• {stats.microAssigned} user(s) assigned micro-training modules (risk ≥ 0.3)</li>
            )}
          </ul>
        </div>
      </motion.div>
    </div>
  )
}

export default TrainingEnforcement
