import React from 'react'
import { motion } from 'framer-motion'
import ParticleCloud from './ParticleCloud'

interface HeroProps {
  onCtaClick: () => void
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
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
    <div
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(168,85,247,0.04) 0%, transparent 50%), #050810',
      }}
    >
      {/* Particle cloud — fills the hero background */}
      <ParticleCloud />

      {/* Content overlay */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6 lg:px-16 text-center">
        <motion.div
          className="max-w-4xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Headline */}
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight">
              <span className="gradient-text-hero">Adaptive AI</span>
              <br />
              <span className="text-white">for Phishing</span>
              <br />
              <span className="gradient-text-hero">Defense</span>
            </h1>
          </motion.div>

          {/* Sub-copy */}
          <motion.p
            variants={itemVariants}
            className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light"
          >
            AI Agents that simulate, detect, and train — so your team stays
            ahead of real-world spear phishing threats.
          </motion.p>

          {/* Chips */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3">
            {[
              'Behavioral Detection',
              'Adaptive Simulation',
              'Micro-Training',
              'Risk Scoring',
            ].map((label, i) => (
              <span
                key={i}
                className="px-4 py-1.5 rounded-full text-sm font-medium border border-slate-700 text-slate-400 bg-slate-800/40"
              >
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 pt-4">
            <motion.button
              onClick={onCtaClick}
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-full text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Demo
            </motion.button>
            <motion.button
              className="px-10 py-4 border border-slate-600 text-slate-300 font-semibold rounded-full text-lg hover:border-cyan-500/50 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div variants={itemVariants} className="pt-16">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-slate-600 text-sm space-y-2"
            >
              <span>Scroll to explore</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Hero
