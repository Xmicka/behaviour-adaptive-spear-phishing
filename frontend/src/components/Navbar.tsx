import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  onLogout?: () => void
}

export default function Navbar({ onLogout }: NavbarProps){
  const navigate = useNavigate()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('demo_auth_user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    if (onLogout) {
      await onLogout()
    } else {
      localStorage.removeItem('demo_auth_user')
      navigate('/')
    }
  }

  // Only show navbar on dashboard
  const showNavbar = location.pathname === '/dashboard'

  if (!showNavbar) return null

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 px-6 lg:px-16 py-4"
      animate={{
        y: isVisible ? 0 : -100,
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white/80 backdrop-blur-lg rounded-xl px-6 py-4 flex items-center justify-between border border-slate-200 shadow-md">
        {/* Logo */}
        <motion.div
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-black text-lg">AS</span>
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">Adaptive</p>
            <p className="text-xs text-slate-700">Security</p>
          </div>
        </motion.div>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center space-x-1">
          {[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Campaigns', path: '/dashboard' },
            { label: 'Reports', path: '/dashboard' },
          ].map((item) => (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-blue-600'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {user && (
            <motion.div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-700">{user.email}</p>
            </motion.div>
          )}
          <motion.button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign Out
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
