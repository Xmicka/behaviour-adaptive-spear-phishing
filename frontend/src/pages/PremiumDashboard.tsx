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
import ImplementationGuide from '../dashboard/ImplementationGuide'
import ShieldScene from '../components/Shield3D'
import Sidebar, { SidebarItem } from '../components/Sidebar'
import EmployeeDirectory from '../dashboard/EmployeeDirectory'

const PremiumDashboard: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'employees', label: 'Employee Directory', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'analytics', label: 'Behavior Analytics', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'training', label: 'Training & Alerts', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { id: 'settings', label: 'System Guard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> }
  ]

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <PremiumNavbar />

      <Sidebar
        items={sidebarItems}
        activeId={activeSection}
        onSelect={scrollToSection}
      />

      {/* Subtle static background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex-1 flex md:ml-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 mt-20 w-full overflow-hidden">

          {/* Group 1: Overview and Centerpiece */}
          <div id="overview" className="space-y-12 pt-8">
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <div className="relative flex flex-col items-center">
                {/* Risk ring layers */}
                <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-pulse" />
                  <div className="absolute inset-3 rounded-full border-2 border-yellow-500/20" />
                  <div className="absolute inset-6 rounded-full border-2 border-green-500/20" />
                  <div className="absolute inset-8 rounded-full overflow-hidden hide-on-mobile">
                    <ShieldScene />
                  </div>
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 backdrop-blur-sm hidden max-[768px]:block" />
                </div>
                <p className="text-center text-gray-400 text-sm mt-4">
                  Global threat landscape — risk layers visualized
                </p>
              </div>
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <SecurityPostureOverview />
            </motion.section>
          </div>

          {/* Group 2: Employee Directory */}
          <div id="employees" className="pt-20 border-t border-slate-800/50">
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <EmployeeDirectory />
            </motion.section>
          </div>

          {/* Group 3: Analytics pipeline */}
          <div id="analytics" className="space-y-12 pt-20 border-t border-slate-800/50">
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <BehavioralRiskDistribution />
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <DataCollection />
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <AdaptivePhishingPipeline />
            </motion.section>

            <div className="flex justify-center py-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all border border-slate-700"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced System Logs
              </button>
            </div>

            <AnimatePresence>
              {showAdvanced && (
                <motion.section
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <AdvancedView />
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Group 4: Training & Alerts */}
          <div id="training" className="space-y-12 pt-20 border-t border-slate-800/50">
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <AlertsRecommendations />
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <SimulationOutcomes />
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <TrainingEnforcement />
            </motion.section>
          </div>

          {/* Group 5: Settings / Implementation */}
          <div id="settings" className="space-y-12 pt-20 border-t border-slate-800/50">
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <div className="glass-dark p-6 rounded-xl border border-slate-700 mb-12 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Browser Extension Deployment</h3>
                  <p className="text-sm text-slate-400 mt-1">Download the pre-configured V3 manifest extension for your workforce.</p>
                </div>
                <a
                  href="/api/extension/download"
                  target="_blank"
                  rel="noreferrer"
                  className="btn px-6 py-3 flex items-center shadow-lg shadow-cyan-500/20"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download ZIP (.ext)
                </a>
              </div>
            </motion.section>

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <ImplementationGuide />
            </motion.section>
          </div>

          {/* Footer spacing */}
          <div className="h-32" />
        </div>
      </div>
    </div>
  )
}

export default PremiumDashboard
