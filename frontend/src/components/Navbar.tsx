import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar(){
  const navigate = useNavigate()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('user')
    navigate('/')
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
      <div className="glass rounded-xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-lg">AG</span>
          </div>
          <div>
            <p className="font-black text-white text-sm">Adaptive</p>
            <p className="text-xs text-gray-400">Guard</p>
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
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ backgroundColor: 'rgba(0, 217, 255, 0.05)' }}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {user && (
            <motion.div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-300">{user.email}</p>
            </motion.div>
          )}
          <motion.button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
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
