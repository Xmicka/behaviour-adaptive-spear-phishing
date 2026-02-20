import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from '../firebase'

interface LoginProps {
  isOpen?: boolean
  onClose?: () => void
}

const Login: React.FC<LoginProps> = ({ isOpen = true, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }

      // Use Firebase auth (demo credentials)
      const user = await signInWithEmailAndPassword(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
        isOpen ? 'bg-black/40 backdrop-blur-sm' : 'pointer-events-none'
      }`}
    >
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate={isOpen ? 'visible' : 'hidden'}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 gradient-glow rounded-2xl"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Main card */}
        <div className="relative glass rounded-2xl p-8 lg:p-12 space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900">
              <span className="gradient-text-dark">Access Dashboard</span>
            </h2>
            <p className="text-slate-700">
              Sign in to view your organization's security posture
            </p>
          </motion.div>

          {/* Form */}
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Email Address
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                whileFocus={{ scale: 1.02 }}
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Password
              </label>
              <motion.input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                whileFocus={{ scale: 1.02 }}
                disabled={isLoading}
              />
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span
                className="absolute inset-0 bg-white"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ opacity: 0.1 }}
              />
              <span className="relative flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-transparent border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </span>
            </motion.button>

            {/* Demo credentials hint */}
            <div className="pt-4 border-t border-slate-300">
              <p className="text-xs text-slate-600 text-center mb-2">
                Demo credentials:
              </p>
              <p className="text-xs text-slate-700 text-center font-mono">
                admin@example.com / DemoPass123<br/>
                owner@example.com / DemoPass123
              </p>
            </div>
          </motion.form>

          {/* Close button */}
          {onClose && isOpen && (
            <motion.button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-200 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="w-6 h-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Login
