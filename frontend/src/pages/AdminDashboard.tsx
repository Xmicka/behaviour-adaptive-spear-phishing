import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminNavbar from '../components/AdminNavbar'
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
import CampaignManager from '../dashboard/CampaignManager'

const AdminDashboard: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  }

  const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'employees', label: 'Employees', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'behaviour', label: 'Behaviour Monitoring', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'campaigns', label: 'Phishing Campaigns', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'generator', label: 'Email Generator', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
    { id: 'training', label: 'Training Center', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
    { id: 'alerts', label: 'Alerts', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: 'reports', label: 'Reports', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'settings', label: 'Settings', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <motion.div key="dashboard" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12">
            <div className="relative flex flex-col items-center pt-8">
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
                Global threat landscape, risk layers visualized
              </p>
            </div>
            <SecurityPostureOverview />
          </motion.div>
        )

      case 'employees':
        return (
          <motion.div key="employees" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="pt-8">
            <EmployeeDirectory />
          </motion.div>
        )

      case 'behaviour':
        return (
          <motion.div key="behaviour" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12 pt-8">
            <BehavioralRiskDistribution />
            <DataCollection />
            <AdaptivePhishingPipeline />
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <AdvancedView />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )

      case 'campaigns':
        return (
          <motion.div key="campaigns" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="pt-8">
            <CampaignManager />
          </motion.div>
        )

      case 'generator':
        return (
          <motion.div key="generator" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12 pt-8">
            <EmailGenerator />
          </motion.div>
        )

      case 'training':
        return (
          <motion.div key="training" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12 pt-8">
            <TrainingEnforcement />
          </motion.div>
        )

      case 'alerts':
        return (
          <motion.div key="alerts" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12 pt-8">
            <AlertsRecommendations />
          </motion.div>
        )

      case 'reports':
        return (
          <motion.div key="reports" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12 pt-8">
            <SimulationOutcomes />
          </motion.div>
        )

      case 'settings':
        return (
          <motion.div key="settings" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-12 pt-8">
            {/* Seed Demo Data */}
            <SeedDemoDataSection />
            
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
            <ImplementationGuide />
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <AdminNavbar />

      <Sidebar
        items={sidebarItems}
        activeId={activeSection}
        onSelect={(id) => setActiveSection(id)}
      />

      {/* Subtle static background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex-1 flex md:ml-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
          <div className="h-32" />
        </div>
      </div>
    </div>
  )
}

// Seed Demo Data Component
function SeedDemoDataSection() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null)

  const handleSeedData = async () => {
    setLoading(true)
    setStatus(null)
    try {
      // Use the backend URL directly (frontend and backend are on different domains)
      const backendUrl = import.meta.env.DEV
        ? '/api/seed-demo-data'
        : 'https://behaviour-adaptive-spear-phishing.onrender.com/api/seed-demo-data'
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      // Get response as text first
      const text = await response.text()
      
      // Check if we got an empty response
      if (!text || text.trim() === '') {
        setStatus({ 
          type: 'error', 
          msg: 'Server returned empty response. Please wait for Render to finish deploying and try again.' 
        })
        return
      }
      
      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        setStatus({ 
          type: 'error', 
          msg: `Invalid JSON response: ${text.substring(0, 100)}...` 
        })
        return
      }
      
      if (response.ok && data.status === 'success') {
        setStatus({ 
          type: 'success', 
          msg: `✅ ${data.message}` 
        })
      } else if (data.status === 'already_seeded') {
        setStatus({ 
          type: 'info', 
          msg: `Database already has ${data.total_events} events for ${data.unique_users} users` 
        })
      } else {
        setStatus({ type: 'error', msg: data.error || data.message || 'Failed to seed demo data' })
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        msg: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      className="glass-dark p-6 rounded-xl border border-slate-700 mb-12"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">🎯 Demo Data Setup</h3>
          <p className="text-sm text-slate-400 mt-1">Load sample employee behavioral data for live testing and demonstrations.</p>
        </div>
        <button
          onClick={handleSeedData}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
            loading 
              ? 'bg-blue-600/50 text-blue-200 cursor-wait'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⚙️</span> Loading...
            </span>
          ) : (
            '📤 Seed Demo Data'
          )}
        </button>
      </div>
      {status && (
        <motion.div 
          className={`mt-4 p-3 rounded-lg text-sm ${
            status.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            status.type === 'info' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
            'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {status.msg}
        </motion.div>
      )}
    </motion.div>
  )
}

export default AdminDashboard

