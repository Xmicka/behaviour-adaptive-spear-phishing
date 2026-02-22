import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface PipelineStage {
  id: string
  label: string
  description: string
  icon: string
  color: string
  details: string[]
}

const PipelineStageCard: React.FC<{
  stage: PipelineStage
  index: number
  isLast: boolean
  hoveredStage: string | null
  onHover: (id: string | null) => void
}> = ({ stage, index, isLast, hoveredStage, onHover }) => {
  const isHovered = hoveredStage === stage.id

  return (
    <div className="flex items-stretch gap-0">
      {/* Stage Card */}
      <motion.div
        className="relative flex-1 min-w-0"
        onMouseEnter={() => onHover(stage.id)}
        onMouseLeave={() => onHover(null)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
      >
        <motion.div
          className={`h-full p-5 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm group ${
            isHovered
              ? `border-${stage.color}-400 bg-${stage.color}-900/30 shadow-lg`
              : `border-${stage.color}-600/30 bg-${stage.color}-900/10 hover:border-${stage.color}-500/60`
          }`}
          style={{
            borderColor: isHovered ? stage.color : `${stage.color}4D`,
            backgroundColor: isHovered
              ? `${stage.color}1A`
              : `${stage.color}0D`,
          }}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: `radial-gradient(circle, ${stage.color}15 0%, transparent 70%)`,
            }}
            animate={{
              opacity: isHovered ? 0.5 : 0,
            }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-2 h-full flex flex-col">
            {/* Icon and Label */}
            <div className="space-y-2">
              <motion.div
                className="text-3xl"
                animate={{ scale: isHovered ? 1.2 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {stage.icon}
              </motion.div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">{stage.label}</h3>
              <p className="text-xs text-gray-300 leading-tight">{stage.description}</p>
            </div>

            {/* Expandable Details */}
            <motion.div
              className="mt-auto pt-3 border-t border-gray-600/30 space-y-1"
              initial={{ opacity: 0, maxHeight: 0 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                maxHeight: isHovered ? 200 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {stage.details.map((detail, idx) => (
                <motion.div
                  key={idx}
                  className="text-xs text-gray-300 flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <span className="mt-0.5">→</span>
                  <span>{detail}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Animated border pulse */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ borderColor: stage.color }}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${stage.color}33`,
                  `0 0 0 8px ${stage.color}00`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Arrow Connector */}
      {!isLast && (
        <motion.div
          className="flex items-center justify-center px-3"
          animate={{
            scale: hoveredStage === stage.id || hoveredStage === `stage-${index + 1}` ? 1.2 : 1,
          }}
        >
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-gray-400 group-hover:text-cyan-400 transition-colors"
            animate={{
              x: hoveredStage ? 3 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.div>
      )}
    </div>
  )
}

const AdaptivePhishingPipeline: React.FC = () => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)

  const stages: PipelineStage[] = [
    {
      id: 'behavior-observed',
      label: 'Behavior Observed',
      description: 'System monitors user activity and interactions',
      icon: '👁️',
      color: '#3b82f6',
      details: [
        'Real-time activity tracking',
        'Anomaly detection active',
        'Pattern recognition enabled',
      ],
    },
    {
      id: 'risk-assessed',
      label: 'Risk Assessed',
      description: 'ML model evaluates behavior risk score',
      icon: '📊',
      color: '#8b5cf6',
      details: [
        'Multi-factor risk analysis',
        'Behavioral scoring applied',
        'Predictive modeling engaged',
      ],
    },
    {
      id: 'phishing-generated',
      label: 'Phishing Generated',
      description: 'Personalized phishing simulation crafted',
      icon: '🎯',
      color: '#ec4899',
      details: [
        'Threat profile matched',
        'Content personalized',
        'Delivery optimized',
      ],
    },
    {
      id: 'user-interaction',
      label: 'User Interaction',
      description: 'Employee receives and responds to phishing',
      icon: '⚡',
      color: '#f59e0b',
      details: [
        'Email delivered',
        'Response captured',
        'Outcome recorded',
      ],
    },
    {
      id: 'training-triggered',
      label: 'Training Triggered',
      description: 'Adaptive training deployed based on outcome',
      icon: '🎓',
      color: '#10b981',
      details: [
        'Immediate micro-training',
        'Personalized content sent',
        'Progress tracked',
      ],
    },
  ]

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
          Adaptive Spear Phishing Pipeline
        </h2>
        <p className="text-gray-400 text-lg">
          End-to-end workflow demonstrating how the system adapts to individual behavioral patterns
        </p>
      </motion.div>

      {/* Pipeline Horizontal Flow */}
      <motion.div
        className="overflow-x-auto pb-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex gap-0 min-w-max md:min-w-0 md:gap-0">
          {stages.map((stage, idx) => (
            <PipelineStageCard
              key={stage.id}
              stage={stage}
              index={idx}
              isLast={idx === stages.length - 1}
              hoveredStage={hoveredStage}
              onHover={setHoveredStage}
            />
          ))}
        </div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {[
          {
            title: 'Behavioral Detection',
            description: 'The system continuously monitors user interactions to establish baseline behavior patterns.',
          },
          {
            title: 'Risk Calculation',
            description: 'Advanced algorithms score risk based on deviations from normal behavior and threat indicators.',
          },
          {
            title: 'Personalized Response',
            description: 'Training and simulations are customized to the specific vulnerabilities identified for each user.',
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-cyan-600/50 transition-colors"
            whileHover={{ borderColor: 'rgb(34, 211, 238, 0.5)' }}
          >
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-cyan-400">●</span> {item.title}
            </h4>
            <p className="text-sm text-gray-400">{item.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        className="p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Detection Time', value: '2.4s' },
            { label: 'Model Accuracy', value: '94.2%' },
            { label: 'Training Completion', value: '87%' },
            { label: 'Behavioral Improvement', value: '+18%' },
          ].map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl font-bold text-cyan-300">{metric.value}</div>
              <div className="text-xs text-gray-400 mt-1">{metric.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default AdaptivePhishingPipeline
