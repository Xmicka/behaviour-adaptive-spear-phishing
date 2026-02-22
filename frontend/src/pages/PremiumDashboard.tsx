import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PremiumNavbar from '../components/PremiumNavbar'
import SecurityPostureOverview from '../dashboard/SecurityPostureOverview'
import DataCollection from '../dashboard/DataCollection'
import BehavioralRiskDistribution from '../dashboard/BehavioralRiskDistribution'
import AdaptivePhishingPipeline from '../dashboard/AdaptivePhishingPipeline'
import SimulationOutcomes from '../dashboard/SimulationOutcomes'
import TrainingEnforcement from '../dashboard/TrainingEnforcement'
import AlertsRecommendations from '../dashboard/AlertsRecommendations'
import EmailGenerator from '../dashboard/EmailGenerator'
import AdvancedView from '../dashboard/AdvancedView'

const PremiumDashboard: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <PremiumNavbar />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"
          animate={{
            y: [0, 50, 0],
            x: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl"
          animate={{
            y: [0, -50, 0],
            x: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 mt-20">
          {/* Section 1: Security Posture Overview */}
          <motion.section
            id="security-posture"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <SecurityPostureOverview />
          </motion.section>

          {/* Section 1.5: Live Data Collection */}
          <motion.section
            id="data-collection"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <DataCollection />
          </motion.section>

          {/* Section 2: Behavioral Risk Distribution */}
          <motion.section
            id="behavioral-risk"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <BehavioralRiskDistribution />
          </motion.section>

          {/* Section 3: Adaptive Spear Phishing Pipeline */}
          <motion.section
            id="adaptive-pipeline"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <AdaptivePhishingPipeline />
          </motion.section>

          {/* Section 3.5: Email Generator */}
          <motion.section
            id="email-generator"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <EmailGenerator />
          </motion.section>

          {/* Section 4: Simulation Outcomes */}
          <motion.section
            id="simulation-outcomes"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <SimulationOutcomes />
          </motion.section>

          {/* Section 5: Training Enforcement */}
          <motion.section
            id="training-enforcement"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <TrainingEnforcement />
          </motion.section>

          {/* Section 6: Alerts & Recommendations */}
          <motion.section
            id="alerts-recommendations"
            className="scroll-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-100px' }}
          >
            <AlertsRecommendations />
          </motion.section>

          {/* Advanced View Toggle */}
          <motion.div
            className="flex justify-center py-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
          >
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Analytics
            </button>
          </motion.div>

          {/* Section 7: Advanced View */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.section
                id="advanced-view"
                className="scroll-section"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                viewport={{ once: false, margin: '-100px' }}
              >
                <AdvancedView />
              </motion.section>
            )}
          </AnimatePresence>

          {/* Footer spacing */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  )
}

export default PremiumDashboard
