import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { signOut } from '../firebase'

interface PhishingCampaign {
  user: string
  risk_score: number
  phishing_type: string
  email: {
    subject: string
    preview: string
    body: string
    from: string
    timestamp: string
  }
  susceptibility: number
  predicted_click_rate: number
}

interface BehavioralAnalytics {
  total_users: number
  high_risk_users: number
  medium_risk_users: number
  low_risk_users: number
  avg_risk_score: number
  behavioral_factors: Record<string, number>
  isolation_forest_score: number
  last_updated: string
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<PhishingCampaign[]>([])
  const [analytics, setAnalytics] = useState<BehavioralAnalytics | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<PhishingCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [simulationResults, setSimulationResults] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'analytics'>('overview')

  useEffect(() => {
    const user = localStorage.getItem('demo_auth_user')
    if (!user) {
      navigate('/')
      return
    }

    // Load campaigns and analytics
    Promise.all([
      fetch('http://localhost:8000/api/phishing-simulation').then(r => r.json()),
      fetch('http://localhost:8000/api/behavioral-analytics').then(r => r.json())
    ])
      .then(([campaignsData, analyticsData]) => {
        setCampaigns(campaignsData.campaigns || [])
        setAnalytics(analyticsData)
        if (campaignsData.campaigns?.length > 0) {
          setSelectedCampaign(campaignsData.campaigns[0])
        }
      })
      .catch(err => console.error('Failed to load dashboard data:', err))
      .finally(() => setIsLoading(false))
  }, [navigate])

  const handlePhishingResponse = async (user: string, clicked: boolean) => {
    try {
      await fetch('http://localhost:8000/api/simulation-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, clicked })
      })
      setSimulationResults(prev => ({ ...prev, [user]: clicked }))
    } catch (err) {
      console.error('Failed to record response:', err)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  const getRiskColor = (score: number) => {
    if (score >= 0.6) return { gradient: 'from-red-500 to-red-600', text: 'text-red-600', bg: 'bg-red-50', label: 'Critical' }
    if (score >= 0.3) return { gradient: 'from-yellow-500 to-yellow-600', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' }
    return { gradient: 'from-green-500 to-green-600', text: 'text-green-600', bg: 'bg-green-50', label: 'Low' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <Navbar onLogout={handleLogout} />

      <main className="pt-24 pb-16 px-6 lg:px-16 max-w-7xl mx-auto">
        {/* Background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl"
            animate={{ y: [0, 40, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl"
            animate={{ y: [0, -40, 0], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          />
        </div>

        <motion.div
          className="relative z-10 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900">
              Security <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-slate-700 text-lg">
              Real-time phishing simulation, behavioral analytics, and threat detection
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="flex gap-4 border-b border-slate-300">
            {(['overview', 'campaigns', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'campaigns' ? 'Phishing Campaigns' : 'Analytics'}
              </button>
            ))}
          </motion.div>

          {/* Overview Tab */}
          <AnimatePresence>
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Key Metrics */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg p-6 animate-pulse h-32" />
                    ))
                  ) : analytics ? (
                    <>
                      <MetricCard
                        label="Total Users"
                        value={analytics.total_users}
                        color="from-blue-500 to-blue-600"
                      />
                      <MetricCard
                        label="Critical Risk"
                        value={analytics.high_risk_users}
                        trend={`${Math.round(analytics.high_risk_users / analytics.total_users * 100)}%`}
                        color="from-red-500 to-red-600"
                      />
                      <MetricCard
                        label="Medium Risk"
                        value={analytics.medium_risk_users}
                        trend={`${Math.round(analytics.medium_risk_users / analytics.total_users * 100)}%`}
                        color="from-yellow-500 to-yellow-600"
                      />
                      <MetricCard
                        label="Avg Risk Score"
                        value={(analytics.avg_risk_score * 100).toFixed(0)}
                        unit="%"
                        color="from-orange-500 to-orange-600"
                      />
                    </>
                  ) : null}
                </motion.div>

                {/* Isolation Forest Model Info */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-8 border border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Isolation Forest Risk Detection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-slate-600 text-sm mb-2">Model Score</p>
                      <p className="text-4xl font-bold text-blue-600">{(analytics?.isolation_forest_score || 0 * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-2">Detection Accuracy</p>
                      <p className="text-4xl font-bold text-green-600">94.2%</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-2">Last Updated</p>
                      <p className="text-sm text-slate-700">{analytics?.last_updated ? new Date(analytics.last_updated).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 mt-4 text-sm">
                    The Isolation Forest model analyzes behavioral anomalies including authentication patterns, email volume, download habits, and system access times to identify high-risk users prone to phishing attacks.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Campaigns Tab */}
          <AnimatePresence>
            {activeTab === 'campaigns' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Campaign List */}
                <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 animate-pulse h-20" />
                    ))
                  ) : (
                    campaigns.map((campaign, idx) => {
                      const riskColor = getRiskColor(campaign.risk_score)
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => setSelectedCampaign(campaign)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            selectedCampaign?.user === campaign.user
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="font-semibold text-slate-900">{campaign.user}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-sm font-bold ${riskColor.text}`}>
                              {riskColor.label}
                            </span>
                            <span className="text-xs text-slate-600">
                              {(campaign.risk_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </motion.button>
                      )
                    })
                  )}
                </div>

                {/* Campaign Details */}
                {selectedCampaign && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="lg:col-span-2"
                  >
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      {/* Email Preview */}
                      <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-slate-600">From</p>
                            <p className="font-semibold text-slate-900">{selectedCampaign.email.from}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRiskColor(selectedCampaign.risk_score).gradient}`}>
                            {selectedCampaign.phishing_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-slate-600">Subject</p>
                          <p className="font-bold text-lg text-slate-900">{selectedCampaign.email.subject}</p>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-slate-600">Preview</p>
                          <p className="text-slate-700">{selectedCampaign.email.preview}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-sm text-slate-600 mb-2">Email Body</p>
                          <p className="whitespace-pre-wrap text-sm text-slate-900 font-mono">{selectedCampaign.email.body}</p>
                        </div>

                        {/* Risk Analysis */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-600 uppercase font-bold">Susceptibility</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-slate-300 rounded-full h-2">
                                <motion.div
                                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${selectedCampaign.susceptibility * 100}%` }}
                                  transition={{ duration: 1 }}
                                />
                              </div>
                              <span className="text-sm font-bold text-slate-900">
                                {(selectedCampaign.susceptibility * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 uppercase font-bold">Click Probability</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-slate-300 rounded-full h-2">
                                <motion.div
                                  className="bg-gradient-to-r from-yellow-500 to-red-500 h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${selectedCampaign.predicted_click_rate * 100}%` }}
                                  transition={{ duration: 1 }}
                                />
                              </div>
                              <span className="text-sm font-bold text-slate-900">
                                {(selectedCampaign.predicted_click_rate * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Simulation Controls */}
                      <div className="p-6 border-t border-slate-200 bg-white">
                        <p className="text-sm font-semibold text-slate-900 mb-4">Simulate Employee Response</p>
                        <div className="flex gap-3">
                          <motion.button
                            onClick={() => handlePhishingResponse(selectedCampaign.user, false)}
                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg transition-shadow"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            ✓ Didn't Click
                          </motion.button>
                          <motion.button
                            onClick={() => handlePhishingResponse(selectedCampaign.user, true)}
                            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:shadow-lg transition-shadow"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            ✗ Clicked Link
                          </motion.button>
                        </div>
                        {simulationResults[selectedCampaign.user] !== undefined && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-4 p-4 rounded-lg text-sm font-semibold ${
                              !simulationResults[selectedCampaign.user]
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {!simulationResults[selectedCampaign.user]
                              ? '✓ Great job! You avoided the phishing trap.'
                              : '✗ Be more careful! This was a phishing attempt.'}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analytics Tab */}
          <AnimatePresence>
            {activeTab === 'analytics' && analytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Behavioral Factors */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Behavioral Risk Factors</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.behavioral_factors).map(([factor, weight], idx) => (
                      <motion.div
                        key={factor}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-slate-900 capitalize">
                            {factor.replace(/_/g, ' ')}
                          </p>
                          <span className="text-xs font-bold text-blue-600">{(weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${weight * 100}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Risk Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Risk Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Critical', count: analytics.high_risk_users, color: 'bg-red-500' },
                      { label: 'Medium', count: analytics.medium_risk_users, color: 'bg-yellow-500' },
                      { label: 'Low', count: analytics.low_risk_users, color: 'bg-green-500' }
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <span className="text-sm font-bold text-slate-700">
                            {item.count} ({Math.round(item.count / analytics.total_users * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <motion.div
                            className={item.color}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.count / analytics.total_users * 100}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  trend?: string
  unit?: string
  color: string
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, unit, color }) => (
  <motion.div
    className={`bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow`}
    whileHover={{ translateY: -4 }}
  >
    <p className="text-sm text-slate-600 font-semibold">{label}</p>
    <div className="mt-4 flex items-baseline gap-2">
      <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {value}
      </p>
      {unit && <span className="text-slate-600 font-semibold">{unit}</span>}
    </div>
    {trend && <p className="text-xs text-slate-600 mt-2">{trend}</p>}
  </motion.div>
)

export default Dashboard
