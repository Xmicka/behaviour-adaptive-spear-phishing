import React from 'react'
import { motion } from 'framer-motion'

interface ScrollSection {
  id: string
  title: string
  subtitle?: string
  content: React.ReactNode
  bgColor?: string
  darkBg?: boolean
}

interface ScrollSectionsProps {
  sections: ScrollSection[]
}

/**
 * Dark-themed scroll sections with once-only fade-in reveals.
 */
const ScrollSections: React.FC<ScrollSectionsProps> = ({ sections }) => (
  <div className="relative w-full" style={{ scrollBehavior: 'smooth' as const }}>
    {sections.map((section) => (
      <ScrollSectionItem key={section.id} section={section} />
    ))}
  </div>
)

const ScrollSectionItem: React.FC<{ section: ScrollSection }> = ({ section }) => {
  return (
    <motion.section
      className="relative min-h-screen flex items-center justify-center px-6 lg:px-16 py-20 overflow-hidden"
      style={{
        background: section.darkBg
          ? 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.04) 0%, transparent 60%), #050810'
          : 'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.03) 0%, transparent 60%), #050810',
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      {/* Static background accent glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -right-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* Content container */}
      <motion.div
        className="relative z-10 w-full max-w-6xl"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Section header */}
        <div className="space-y-4 mb-16">
          {section.title && (
            <motion.h2
              className="text-4xl lg:text-5xl font-black leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <span className="gradient-text">{section.title}</span>
            </motion.h2>
          )}
          {section.subtitle && (
            <motion.p
              className="text-lg text-slate-400 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {section.subtitle}
            </motion.p>
          )}
        </div>

        {/* Section content */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {section.content}
        </motion.div>
      </motion.div>

      {/* Bottom divider accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-cyan-500/30 to-transparent" />
    </motion.section>
  )
}

export default ScrollSections
