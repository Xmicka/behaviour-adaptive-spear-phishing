import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardData, type DashboardData } from '../api/client'

interface RiskSegment {
  category: string
  value: number
  percentage: number
  color: string
  icon: string
}

const BehavioralRiskDistribution: React.FC = () => {
  const [segments, setSegments] = useState<RiskSegment[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData().then(data => {
      if (data) {
        const { high, medium, low } = data.risk_distribution
        const total = high + medium + low
        setTotalUsers(total)

        if (total > 0) {
          setSegments([
            { category: 'Safe', value: low, percentage: Math.round((low / total) * 100), color: '#10b981', icon: '✓' },
            { category: 'Watchlist', value: medium, percentage: Math.round((medium / total) * 100), color: '#f59e0b', icon: '⚠️' },
            { category: 'High Risk', value: high, percentage: Math.round((high / total) * 100), color: '#ef4444', icon: '⚡' },
          ])
        } else {
          setSegments([
            { category: 'Safe', value: 0, percentage: 0, color: '#10b981', icon: '✓' },
            { category: 'Watchlist', value: 0, percentage: 0, color: '#f59e0b', icon: '⚠️' },
            { category: 'High Risk', value: 0, percentage: 0, color: '#ef4444', icon: '⚡' },
          ])
        }
      }
      setLoading(false)
    })
  }, [])

  let currentAngle = 0
  const segmentAngles = segments.map(segment => {
    const startAngle = currentAngle
    const endAngle = currentAngle + (segment.percentage * 3.6)
    currentAngle = endAngle
    return { startAngle, endAngle }
  })

  const createPath = (startAngle: number, endAngle: number, radius: number = 100) => {
    if (endAngle - startAngle <= 0) return ''
    const start = polarToCartesian(radius, endAngle)
    const end = polarToCartesian(radius, startAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${radius},${radius} L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArc},0 ${end.x},${end.y} Z`
  }

  const polarToCartesian = (radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: radius + radius * Math.cos(angleInRadians),
      y: radius + radius * Math.sin(angleInRadians),
    }
  }

  const safePercent = (s: RiskSegment) => totalUsers > 0 ? s.percentage : 0

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
          Behavioral Risk Distribution
        </h2>
        <p className="text-gray-400 text-lg">
          Real-time categorization from Isolation Forest anomaly detection pipeline
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          className="lg:col-span-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {segments.map((segment, idx) => {
                const path = createPath(segmentAngles[idx]?.startAngle ?? 0, segmentAngles[idx]?.endAngle ?? 0, 80)
                if (!path) return null
                return (
                  <motion.path
                    key={idx}
                    d={path}
                    fill={segment.color}
                    opacity="0.8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: idx * 0.2, duration: 0.6 }}
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                  >
                    <title>{segment.category}</title>
                  </motion.path>
                )
              })}
            </svg>

            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-3xl font-bold text-white">{loading ? '...' : totalUsers}</div>
              <div className="text-xs text-gray-400 text-center">Total</div>
              <div className="text-xs text-gray-400 text-center">Users</div>
            </motion.div>

            {segments.find(s => s.category === 'High Risk' && s.value > 0) && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-500"
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>

        <div className="lg:col-span-2 space-y-6">
          {segments.map((segment, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
            >
              <div className="group cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-lg font-semibold text-white">{segment.category}</span>
                    <span className="text-sm text-gray-400">({segment.value} users)</span>
                  </div>
                  <span className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {safePercent(segment)}%
                  </span>
                </div>

                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-full rounded-full transition-colors group-hover:brightness-125"
                    style={{ backgroundColor: segment.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${safePercent(segment)}%` }}
                    viewport={{ once: false }}
                    transition={{ delay: idx * 0.2, duration: 1, type: 'tween' }}
                  />
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  {segment.category === 'Safe' &&
                    'Users demonstrating normal behavioral patterns — no anomalies detected'}
                  {segment.category === 'Watchlist' &&
                    'Users showing moderate deviation from baseline — monitor and provide targeted training'}
                  {segment.category === 'High Risk' &&
                    'Users with significant behavioral anomalies — immediate intervention recommended'}
                </p>
              </div>
            </motion.div>
          ))}

          <motion.div
            className="mt-8 p-4 rounded-lg bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-700/30"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-green-200">
              {totalUsers > 0 ? (
                <>
                  <span className="font-semibold">✓ Live Data:</span>{' '}
                  {segments.find(s => s.category === 'Safe')?.percentage ?? 0}% of users show normal behavior.
                  Focus training on the {(segments.find(s => s.category === 'Watchlist')?.percentage ?? 0) +
                    (segments.find(s => s.category === 'High Risk')?.percentage ?? 0)}% in watchlist and high-risk categories.
                </>
              ) : (
                <>
                  <span className="font-semibold">ℹ No data yet:</span> Run the pipeline after collecting behavioral events to see the risk distribution.
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default BehavioralRiskDistribution
