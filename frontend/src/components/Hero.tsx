import React from 'react'
import { motion } from 'framer-motion'
import ShieldScene from './Shield3D'

interface HeroProps {
  onCtaClick: () => void
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 overflow-hidden flex items-center justify-center">
      {/* Animated background gradient orbs - softer colors */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
        animate={{
          y: [0, 40, 0],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full"
        animate={{
          y: [0, -40, 0],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full h-screen flex flex-col lg:flex-row items-center justify-between px-6 lg:px-16 gap-8">
        {/* Left side: Text content */}
        <motion.div
          className="flex-1 flex flex-col justify-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Product name */}
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl lg:text-7xl font-black leading-tight text-slate-900">
              <span className="gradient-text-dark">Adaptive</span>
              <br />
              <span className="gradient-text-dark">Security</span>
            </h1>
          </motion.div>

          {/* Bold statement */}
          <motion.p
            variants={itemVariants}
            className="text-lg lg:text-xl text-slate-700 max-w-xl leading-relaxed font-light"
          >
            AI-driven spear phishing simulation and adaptive micro-training that evolves with your organization's threat landscape.
          </motion.p>

          {/* Quick benefits */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-700">Real-time behavioral detection</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-700">Contextual threat simulation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-700">Personalized risk scoring</span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              onClick={onCtaClick}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg text-lg group relative overflow-hidden shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="absolute inset-0 bg-white"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ opacity: 0.2 }}
              />
              <span className="relative flex items-center space-x-2">
                <span>View Demo</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            variants={itemVariants}
            className="pt-8 text-slate-600 text-sm"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-start space-y-2"
            >
              <span>Scroll to explore</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right side: 3D Shield */}
        <motion.div
          className="flex-1 w-full h-screen relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <ShieldScene />

          {/* Floating accent elements around shield */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-1 h-1 bg-blue-500 rounded-full"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default Hero
