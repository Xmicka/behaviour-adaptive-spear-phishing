import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DemoStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const steps: DemoStep[] = [
  {
    id: 1,
    title: 'Phishing Simulation',
    description: 'Employees receive AI-crafted spear phishing emails tailored to their role and context',
    icon: '📧',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 2,
    title: 'User Response',
    description: 'System tracks click behavior, time to decision, and response patterns',
    icon: '👆',
    color: 'from-blue-500 to-purple-500',
  },
  {
    id: 3,
    title: 'Risk Scoring',
    description: 'Dynamic risk assessment based on behavior, role, and organizational patterns',
    icon: '📊',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 4,
    title: 'Micro-Training',
    description: 'Immediate, contextual training deployed when risks are detected',
    icon: '🎓',
    color: 'from-pink-500 to-red-500',
  },
]

const DemoFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleStartSimulation = () => {
    setIsSimulating(true)
    setActiveStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < steps.length) {
        setActiveStep(step)
      } else {
        clearInterval(interval)
        setTimeout(() => setIsSimulating(false), 2000)
      }
    }, 2000)
  }

  return (
    <div className="space-y-12">
      {/* Interactive flow */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-2">
        {steps.map((step, idx) => (
          <motion.div
            key={step.id}
            className="relative group cursor-pointer"
            onClick={() => setActiveStep(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className={`p-6 rounded-xl glass text-center transition-all duration-300 ${activeStep >= idx ? 'border-cyan-500/30' : ''
                }`}
              animate={{
                boxShadow:
                  activeStep >= idx
                    ? '0 0 30px rgba(34, 211, 238, 0.15)'
                    : '0 0 0px rgba(34, 211, 238, 0)',
              }}
            >
              <motion.div
                className={`text-4xl mb-4 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                animate={{ scale: activeStep === idx ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {step.icon}
              </motion.div>

              <h3 className="text-sm lg:text-base font-bold text-white mb-2">
                {step.title}
              </h3>

              {/* Progress bar */}
              <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${step.color}`}
                  initial={{ width: '0%' }}
                  animate={{
                    width: activeStep > idx ? '100%' : activeStep === idx ? '50%' : '0%',
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Connector */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-slate-700 -translate-y-1/2">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${step.color}`}
                    animate={{ width: activeStep > idx ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Description panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          className="glass p-8 lg:p-12 rounded-xl min-h-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <div className="space-y-4">
            <h4 className="text-2xl lg:text-3xl font-bold text-white">
              {steps[activeStep].title}
            </h4>
            <p className="text-slate-400 text-lg leading-relaxed">
              {steps[activeStep].description}
            </p>

            <div className="pt-4">
              {activeStep === 0 && (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>✓ Context-aware email generation</p>
                  <p>✓ Personalized targeting based on organization profile</p>
                  <p>✓ Multi-variant campaign support</p>
                </div>
              )}
              {activeStep === 1 && (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>✓ Real-time interaction monitoring</p>
                  <p>✓ Behavioral pattern recognition</p>
                  <p>✓ Anomaly detection algorithms</p>
                </div>
              )}
              {activeStep === 2 && (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>✓ Isolation Forest anomaly scoring</p>
                  <p>✓ Aggregate organizational risk assessment</p>
                  <p>✓ Trend analysis and forecasting</p>
                </div>
              )}
              {activeStep === 3 && (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>✓ Immediate contextual education</p>
                  <p>✓ Long-form training assignment</p>
                  <p>✓ Engagement tracking and compliance</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Simulate button */}
      <div className="flex justify-center">
        <motion.button
          onClick={handleStartSimulation}
          disabled={isSimulating}
          className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSimulating ? 'Simulating...' : 'Run Demo Flow'}
        </motion.button>
      </div>
    </div>
  )
}

export default DemoFlow
