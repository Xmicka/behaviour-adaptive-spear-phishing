import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signOut } from '../firebase'

interface PremiumNavbarProps {
  onLogout?: () => void
}

export default function PremiumNavbar({ onLogout }: PremiumNavbarProps) {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('demo_auth_user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    localStorage.removeItem('demo_auth_user')
    navigate('/')
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'py-3 shadow-lg shadow-cyan-500/10'
        : 'py-6'
        }`}
      style={{
        background: isScrolled
          ? 'rgba(15, 23, 42, 0.95) url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          : 'transparent',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(34, 211, 238, 0.1)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/dashboard-premium')}
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-lg">🛡️</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Adaptive Phishing</p>
            <p className="text-xs text-cyan-400">Security Platform</p>
          </div>
        </motion.div>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Overview', id: 'security-posture' },
            { label: 'Data', id: 'data-collection' },
            { label: 'Risk', id: 'behavioral-risk' },
            { label: 'Pipeline', id: 'adaptive-pipeline' },
            { label: 'Email', id: 'email-generator' },
            { label: 'Outcomes', id: 'simulation-outcomes' },
            { label: 'Training', id: 'training-enforcement' },
          ].map(item => (
            <motion.button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {user && (
            <motion.div className="hidden md:block text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Logged in as</p>
              <p className="text-sm font-semibold text-white">{user.email || 'Admin'}</p>
            </motion.div>
          )}

          <motion.button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600/50 to-red-700/50 border border-red-500/50 hover:border-red-500 transition-all"
            whileHover={{ scale: 1.05, borderColor: 'rgb(239, 68, 68)' }}
            whileTap={{ scale: 0.95 }}
          >
            Sign Out
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
