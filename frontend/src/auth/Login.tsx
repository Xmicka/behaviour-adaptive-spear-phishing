import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface LoginProps {
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Dark-themed login modal matching MazeHQ aesthetic.
 * Email/password + optional Google sign-in.
 */
const Login: React.FC<LoginProps> = ({ isOpen = true, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, loginWithGoogle, isFirebase } = useAuth()

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
      await login(email, password)
      navigate('/dashboard-premium')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setIsLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard-premium')
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1, scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'pointer-events-none'
        }`}
    >
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate={isOpen ? 'visible' : 'hidden'}
      >
        {/* Card */}
        <div className="relative glass-dark rounded-2xl p-8 lg:p-12 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black">
              <span className="gradient-text">Access Dashboard</span>
            </h2>
            <p className="text-slate-400">
              Sign in to view your organization's security posture
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
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

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                disabled={isLoading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-full relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              <span className="relative flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-transparent border-t-slate-950 rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </span>
            </button>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading || !isFirebase}
              className="w-full py-3 bg-slate-800/60 border border-slate-700 text-slate-300 font-semibold rounded-full flex items-center justify-center gap-3 hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isFirebase ? 'Sign in with Google' : 'Google (requires Firebase)'}</span>
            </button>

            {/* Demo creds */}
            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 text-center mb-2">Demo credentials:</p>
              <p className="text-xs text-slate-400 text-center font-mono">
                admin@example.com / DemoPass123<br />
                owner@example.com / DemoPass123
              </p>
            </div>
          </form>

          {/* Close */}
          {onClose && isOpen && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Login
