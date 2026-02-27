import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'

/**
 * Premium navbar with scroll-aware background,
 * section navigation, and a mobile hamburger menu.
 */
export default function PremiumNavbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
    navigate('/')
  }

  const scrollToSection = (id: string) => {
    setMobileOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navItems = [
    { label: 'Overview', id: 'security-posture' },
    { label: 'Data', id: 'data-collection' },
    { label: 'Risk', id: 'behavioral-risk' },
    { label: 'Pipeline', id: 'adaptive-pipeline' },
    { label: 'Email', id: 'email-generator' },
    { label: 'Outcomes', id: 'simulation-outcomes' },
    { label: 'Training', id: 'training-enforcement' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3 shadow-lg shadow-cyan-500/10' : 'py-6'
          }`}
        style={{
          background: isScrolled ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(10px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(34, 211, 238, 0.1)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard-premium')}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">🛡️</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Adaptive Phishing</p>
              <p className="text-xs text-cyan-400">Security Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Logged in as</p>
                <p className="text-sm font-semibold text-white">{user.email || 'Admin'}</p>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="hidden sm:block px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600/50 to-red-700/50 border border-red-500/50 hover:border-red-500 transition-all"
            >
              Sign Out
            </button>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />

            {/* Panel */}
            <motion.nav
              className="absolute top-0 right-0 w-72 h-full bg-slate-900 border-l border-slate-700/50 p-6 pt-20 space-y-2 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}

              <hr className="border-slate-700/50 my-4" />

              {user && (
                <p className="text-xs text-gray-400 px-4">
                  {user.email}
                </p>
              )}

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                Sign Out
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
