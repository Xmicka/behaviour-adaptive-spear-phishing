import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import ScrollSections from '../components/ScrollSections'
import DemoFlow from '../components/DemoFlow'
import Login from '../auth/Login'

const Landing: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false)

  const sections = [
    {
      id: 'what-we-do',
      title: 'What We Do',
      subtitle: 'Behavior-Adaptive Threat Detection',
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Targeted Simulation',
                description: 'Craft phishing campaigns that mirror real-world threats specific to your organization',
              },
              {
                icon: '🧠',
                title: 'Intelligent Detection',
                description: 'AI-powered behavioral analysis identifies at-risk employees before breaches occur',
              },
              {
                icon: '📈',
                title: 'Dynamic Risk Scoring',
                description: 'Real-time risk assessment adapts to organizational changes and threat evolution',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="glass p-6 lg:p-8 rounded-xl space-y-4 group hover:border-cyan-500/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{ translateY: -5 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl">{item.icon}</div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'pipeline',
      title: 'Adaptive Pipeline',
      subtitle: 'From Simulation to Training',
      content: <DemoFlow />,
    },
    {
      id: 'features',
      title: 'Enterprise Features',
      darkBg: true,
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                title: 'Multi-Campaign Management',
                items: ['Concurrent phishing simulations', 'A/B testing capabilities', 'Scheduled campaign deployment'],
              },
              {
                title: 'Advanced Analytics',
                items: ['Aggregate risk dashboards', 'Behavioral trend analysis', 'Compliance reporting'],
              },
              {
                title: 'Micro-Training Engine',
                items: ['Real-time contextual education', 'Long-form training tracking', 'Progress and engagement metrics'],
              },
              {
                title: 'Integration & API',
                items: ['REST API for custom workflows', 'Third-party tool integration', 'Single Sign-On (SSO) support'],
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="glass p-8 rounded-xl space-y-4"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'metrics',
      title: 'Industry Results',
      subtitle: 'Measurable Security Impact',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[
            { value: '85%', label: 'Reduction in Click-through Rates' },
            { value: '3x', label: 'Faster Risk Identification' },
            { value: '24/7', label: 'Continuous Monitoring' },
            { value: '100%', label: 'Audit-Ready Compliance' },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              className="glass p-8 rounded-xl text-center space-y-2 group hover:border-cyan-500/30 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ scale: 1.05 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl lg:text-5xl font-black gradient-text">
                {metric.value}
              </div>
              <p className="text-slate-400 text-sm">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="relative">
      {/* Hero */}
      <Hero onCtaClick={() => setShowLogin(true)} />

      {/* Scroll sections */}
      <ScrollSections sections={sections} />

      {/* CTA Footer */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center px-6 lg:px-16 py-20 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(34,211,238,0.05) 0%, transparent 60%), radial-gradient(ellipse at 50% 20%, rgba(168,85,247,0.04) 0%, transparent 60%), #050810' }}
      >
        <motion.div
          className="relative z-10 max-w-3xl text-center space-y-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight">
            Ready to Transform Your
            <br />
            <span className="gradient-text">Security Posture?</span>
          </h2>

          <motion.p
            className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join leading organizations that are using adaptive threat simulation to
            reduce security risk and build a security-aware culture.
          </motion.p>

          <motion.div
            className="flex flex-col lg:flex-row gap-4 justify-center pt-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.button
              onClick={() => setShowLogin(true)}
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-full text-lg shadow-lg shadow-cyan-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>

            <motion.button
              className="px-10 py-4 border border-slate-600 text-slate-300 font-semibold rounded-full text-lg hover:border-cyan-500/50 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-slate-600 mb-4">Trusted by enterprise security teams</p>
            <div className="flex justify-center items-center space-x-6 text-slate-500">
              <span className="font-semibold">Enterprise Security</span>
              <span>•</span>
              <span className="font-semibold">24/7 Support</span>
              <span>•</span>
              <span className="font-semibold">SOC 2 Compliant</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Login Modal */}
      <Login isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}

export default Landing
