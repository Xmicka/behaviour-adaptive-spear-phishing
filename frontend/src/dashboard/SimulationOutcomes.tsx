import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardData, sendPhishingEmail, sendAutoEmails, type DashboardUser, type EmailLogEntry, type EmailStats } from '../api/client'

const SimulationOutcomes: React.FC = () => {
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([])
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [filterTier, setFilterTier] = useState<'all' | 'High' | 'Medium' | 'Low'>('all')
  const [activeTab, setActiveTab] = useState<'users' | 'emails'>('users')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [autoSending, setAutoSending] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const loadData = () => {
    fetchDashboardData().then(data => {
      if (data) {
        setUsers(data.users)
        setEmailLog(data.email_log || [])
        setEmailStats(data.email_stats || null)
      }
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [])

  const filteredUsers = filterTier === 'all' ? users : users.filter(u => u.tier === filterTier)

  const handleSendEmail = async (userId: string) => {
    setSending(userId)
    setMessage(null)
    const result = await sendPhishingEmail(userId)
    if (result && !result.error) {
      setMessage({ text: `Email sent to ${userId} (${result.mode} mode)`, type: 'success' })
      loadData()
    } else {
      setMessage({ text: result?.error || 'Failed to send email', type: 'error' })
    }
    setSending(null)
  }

  const handleAutoSend = async () => {
    setAutoSending(true)
    setMessage(null)
    const result = await sendAutoEmails()
    if (result) {
      setMessage({
        text: `Auto-send complete: ${result.emails_sent} email(s) sent, ${result.skipped.length} skipped`,
        type: result.emails_sent > 0 ? 'success' : 'info',
      })
      loadData()
    } else {
      setMessage({ text: 'Auto-send failed', type: 'error' })
    }
    setAutoSending(false)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'High': return { bg: 'bg-red-900/20', border: 'border-red-700/50', text: 'text-red-300', badge: 'bg-red-500' }
      case 'Medium': return { bg: 'bg-yellow-900/20', border: 'border-yellow-700/50', text: 'text-yellow-300', badge: 'bg-yellow-500' }
      case 'Low': return { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-300', badge: 'bg-green-500' }
      default: return { bg: 'bg-gray-900/20', border: 'border-gray-700/50', text: 'text-gray-300', badge: 'bg-gray-500' }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clicked': return 'text-red-400 bg-red-900/30'
      case 'opened': return 'text-yellow-400 bg-yellow-900/30'
      case 'reported': return 'text-green-400 bg-green-900/30'
      default: return 'text-blue-400 bg-blue-900/30'
    }
  }

  const stats = {
    high: users.filter(u => u.tier === 'High').length,
    medium: users.filter(u => u.tier === 'Medium').length,
    low: users.filter(u => u.tier === 'Low').length,
  }

  return (
    <div className="space-y-8">
      <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false }} transition={{ duration: 0.5 }}>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
          Simulation Outcomes
        </h2>
        <p className="text-gray-400 text-lg">Email campaigns, user risk profiles, and phishing outcomes</p>
      </motion.div>

      {/* Email Stats Banner */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false }} transition={{ delay: 0.1, duration: 0.5 }}
      >
        {[
          { label: 'Emails Sent', value: emailStats?.total_sent ?? 0, color: 'text-blue-400', icon: '📧' },
          { label: 'Opened', value: emailStats?.total_opened ?? 0, color: 'text-yellow-400', icon: '📬' },
          { label: 'Clicked', value: emailStats?.total_clicked ?? 0, color: 'text-red-400', icon: '🖱️' },
          { label: 'Reported', value: emailStats?.total_reported ?? 0, color: 'text-green-400', icon: '🛡️' },
          { label: 'Click Rate', value: `${((emailStats?.click_rate ?? 0) * 100).toFixed(0)}%`, color: 'text-purple-400', icon: '📊' },
        ].map((stat, idx) => (
          <motion.div key={idx} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center" whileHover={{ translateY: -4 }}>
            <div className="text-2xl opacity-50 mb-1">{stat.icon}</div>
            <div className={`text-xl font-bold ${stat.color}`}>{loading ? '...' : stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Auto-Send Button */}
      <motion.div className="flex items-center gap-4 flex-wrap" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false }}>
        <button
          onClick={handleAutoSend}
          disabled={autoSending}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 text-sm"
        >
          {autoSending ? '⏳ Sending...' : '🚀 Auto-Send to High-Risk Users'}
        </button>
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-700/50' :
              message.type === 'error' ? 'bg-red-900/30 text-red-300 border border-red-700/50' :
                'bg-blue-900/30 text-blue-300 border border-blue-700/50'
            }`}>
            {message.text}
          </div>
        )}
      </motion.div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        {(['users', 'emails'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 text-gray-300 border border-slate-700 hover:border-cyan-600/50'
              }`}
          >
            {tab === 'users' ? '👤 User Profiles' : `📧 Email Log (${emailLog.length})`}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'High', 'Medium', 'Low'] as const).map(tier => (
              <motion.button
                key={tier} onClick={() => setFilterTier(tier)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filterTier === tier
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-gray-300 border border-slate-700 hover:border-cyan-600/50'
                  }`}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                {tier === 'all' ? `All (${users.length})` : `${tier} (${stats[tier.toLowerCase() as keyof typeof stats]})`}
              </motion.button>
            ))}
          </div>

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
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false }} transition={{ delay: idx * 0.05, duration: 0.4 }}
                    whileHover={{ translateX: 8 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
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
                          <motion.div className={`w-3 h-3 rounded-full ${colors.badge}`} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                          <span className={`capitalize font-semibold text-sm ${colors.text}`}>{user.tier}</span>
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        <span className="text-xs text-gray-400 line-clamp-2">{user.risk_reason || 'Analyzed'}</span>
                      </div>
                      <div className="md:col-span-1 text-right">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${user.risk_score >= 0.6 ? 'bg-red-500/80' : user.risk_score >= 0.3 ? 'bg-yellow-500/80' : 'bg-green-500/80'
                          } text-white text-sm font-semibold`}>
                          {(user.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="md:col-span-1 text-right">
                        <p className="text-xs text-gray-400">Failed: {(user.failed_login_ratio * 100).toFixed(0)}%</p>
                      </div>
                      <div className="md:col-span-1 text-right">
                        <button
                          onClick={() => handleSendEmail(user.user_id)}
                          disabled={sending === user.user_id}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-medium transition-all disabled:opacity-50"
                        >
                          {sending === user.user_id ? '⏳' : '📧 Send'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </>
      )}

      {/* Email Log Tab */}
      {activeTab === 'emails' && (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {emailLog.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-3xl mb-2">📭</div>
              No emails sent yet. Use the "Send" button or "Auto-Send" to start.
            </div>
          ) : (
            emailLog.map((email, idx) => (
              <motion.div
                key={email.email_id}
                className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/40 hover:border-cyan-600/50 transition-all"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                  <div className="md:col-span-2">
                    <p className="font-medium text-white text-sm">{email.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">To: {email.user_id} • {email.scenario.replace('_', ' ')}</p>
                  </div>
                  <div className="md:col-span-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(email.status)}`}>
                      {email.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="md:col-span-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${email.risk_score >= 0.6 ? 'bg-red-900/30 text-red-300' :
                        email.risk_score >= 0.3 ? 'bg-yellow-900/30 text-yellow-300' :
                          'bg-green-900/30 text-green-300'
                      }`}>
                      Risk: {(email.risk_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="md:col-span-1">
                    <span className="text-xs text-gray-400">{email.sent_via}</span>
                  </div>
                  <div className="md:col-span-1 text-right">
                    <span className="text-xs text-gray-500">
                      {new Date(email.sent_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {email.interactions && email.interactions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex gap-2 flex-wrap">
                      {email.interactions.map((i, iIdx) => (
                        <span key={iIdx} className={`text-xs px-2 py-1 rounded ${i.interaction === 'click' ? 'bg-red-900/40 text-red-300' :
                            i.interaction === 'open' ? 'bg-yellow-900/40 text-yellow-300' :
                              'bg-green-900/40 text-green-300'
                          }`}>
                          {i.interaction} @ {new Date(i.timestamp).toLocaleTimeString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      <motion.div
        className="p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false }} transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-cyan-200">
          <span className="font-semibold">📊 Live Data:</span>{' '}
          {emailStats && emailStats.total_sent > 0
            ? `${emailStats.total_sent} emails sent. Click rate: ${(emailStats.click_rate * 100).toFixed(0)}%. ${emailStats.total_reported} reported correctly.`
            : users.length > 0
              ? `${stats.high} high-risk user(s) ready for phishing simulation. Click "Auto-Send" to begin.`
              : 'Awaiting pipeline execution to generate risk profiles.'}
        </p>
      </motion.div>
    </div>
  )
}

export default SimulationOutcomes
