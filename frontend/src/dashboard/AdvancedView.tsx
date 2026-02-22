import React, { useState } from 'react'
import { motion } from 'framer-motion'

const AdvancedView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'risk-distribution' | 'feature-contribution' | 'model-status'>(
    'risk-distribution'
  )

  // Risk score distribution data
  const riskDistribution = {
    bins: [
      { range: '0.0-0.1', count: 45, percentage: 18, color: '#10b981' },
      { range: '0.1-0.2', count: 68, percentage: 28, color: '#3b82f6' },
      { range: '0.2-0.3', count: 54, percentage: 22, color: '#8b5cf6' },
      { range: '0.3-0.4', count: 38, percentage: 15, color: '#f59e0b' },
      { range: '0.4-0.5', count: 24, percentage: 10, color: '#ef4444' },
      { range: '0.5+', count: 18, percentage: 7, color: '#dc2626' },
    ],
  }

  // Feature contribution (importance in model)
  const featureContribution = [
    { name: 'Email Open Time Pattern', importance: 0.24, delta: '+2.3%' },
    { name: 'Click Velocity', importance: 0.19, delta: '+0.8%' },
    { name: 'Attachment Interaction', importance: 0.16, delta: '-1.2%' },
    { name: 'Link Hover Duration', importance: 0.14, delta: '+3.1%' },
    { name: 'Device Switching Frequency', importance: 0.11, delta: '-0.4%' },
    { name: 'Off-hours Activity', importance: 0.09, delta: '+1.5%' },
    { name: 'Previous Incident History', importance: 0.07, delta: '+0.2%' },
  ]

  // Model performance metrics
  const modelMetrics = {
    accuracy: 94.2,
    precision: 91.8,
    recall: 89.5,
    f1Score: 90.6,
    dataPoints: 2847,
    lastTrained: '5 days ago',
    nextTraining: 'In 10 days',
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
          Advanced Analytics
        </h2>
        <p className="text-gray-400 text-lg">
          Technical deep-dive into model performance and behavioral factors (for advanced users)
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.2 }}
      >
        {(['risk-distribution', 'feature-contribution', 'model-status'] as const).map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-gray-300 border border-slate-700 hover:border-cyan-600/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab === 'risk-distribution' && '📊 Risk Distribution'}
            {tab === 'feature-contribution' && '🔍 Feature Contribution'}
            {tab === 'model-status' && '⚙️ Model Status'}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Risk Distribution Tab */}
        {activeTab === 'risk-distribution' && (
          <div className="space-y-6">
            <p className="text-gray-400">
              Distribution of behavioral risk scores across all monitored employees. Higher scores indicate increased
              susceptibility to phishing attacks.
            </p>

            {/* Risk Distribution Chart */}
            <div className="space-y-4">
              {riskDistribution.bins.map((bin, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-white w-16">{bin.range}</span>
                    <span className="text-sm text-gray-400">{bin.count} users</span>
                    <span className="text-xs text-gray-500 ml-auto">{bin.percentage}%</span>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: bin.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bin.percentage * 3}%` }}
                      viewport={{ once: false }}
                      transition={{ delay: idx * 0.1, duration: 1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Statistics */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ delay: 0.4 }}
            >
              {[
                { label: 'Mean Score', value: '0.32' },
                { label: 'Median Score', value: '0.28' },
                { label: 'Std Dev', value: '0.18' },
                { label: 'Total Users', value: '247' },
              ].map((stat, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-lg font-bold text-cyan-300 mt-1">{stat.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Feature Contribution Tab */}
        {activeTab === 'feature-contribution' && (
          <div className="space-y-6">
            <p className="text-gray-400">
              Relative importance of behavioral features in the ML model. Shows which factors contribute most to risk
              predictions.
            </p>

            {/* Feature List */}
            <div className="space-y-3">
              {featureContribution.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/40 group hover:border-cyan-600/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{feature.name}</p>
                      <p className={`text-xs ${feature.delta.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {feature.delta}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-cyan-300">{(feature.importance * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${feature.importance * 100}%` }}
                      viewport={{ once: false }}
                      transition={{ delay: idx * 0.1, duration: 1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Interpretation */}
            <motion.div
              className="p-4 rounded-lg bg-blue-900/20 border border-blue-700/30"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-blue-200">
                <span className="font-semibold">ℹ️ Interpretation:</span> Email open time patterns and click velocity
                are the strongest predictors. This suggests that behavioral timing and engagement speed are key
                indicators of phishing susceptibility.
              </p>
            </motion.div>
          </div>
        )}

        {/* Model Status Tab */}
        {activeTab === 'model-status' && (
          <div className="space-y-6">
            <p className="text-gray-400">
              Current status and performance metrics of the behavioral risk prediction model (Isolation Forest with
              behavioral features).
            </p>

            {/* Performance Metrics Grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
            >
              {[
                { label: 'Accuracy', value: modelMetrics.accuracy.toFixed(1) + '%', color: 'text-green-400' },
                { label: 'Precision', value: modelMetrics.precision.toFixed(1) + '%', color: 'text-blue-400' },
                { label: 'Recall', value: modelMetrics.recall.toFixed(1) + '%', color: 'text-purple-400' },
                { label: 'F1 Score', value: modelMetrics.f1Score.toFixed(1) + '%', color: 'text-cyan-400' },
              ].map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50"
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{metric.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Model Details */}
            <motion.div
              className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/40 space-y-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ delay: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Data Points</p>
                  <p className="text-2xl font-bold text-white mt-1">{modelMetrics.dataPoints.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Training Date</p>
                  <p className="text-base text-gray-300 mt-1">{modelMetrics.lastTrained}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-700/50">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Next Training</p>
                <p className="text-base text-gray-300 mt-1">{modelMetrics.nextTraining}</p>
              </div>
            </motion.div>

            {/* Model Health */}
            <motion.div
              className="p-4 rounded-lg bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-700/30 space-y-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ delay: 0.4 }}
            >
              <p className="font-semibold text-green-200">✓ Model Status: Healthy</p>
              <ul className="text-sm text-green-200/80 space-y-1 ml-4">
                <li>• Performance stable within expected range</li>
                <li>• Data distribution consistent with baseline</li>
                <li>• No drift detected in recent predictions</li>
                <li>• Sufficient training data collected for next iteration</li>
              </ul>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-gray-300">Note:</span> This advanced view is intended for security and IT
          administrators. All metrics are derived from behavioral analysis and are used solely to improve training
          effectiveness and security posture.
        </p>
      </motion.div>
    </div>
  )
}

export default AdvancedView
