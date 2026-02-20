import React, { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'

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

const ScrollSections: React.FC<ScrollSectionsProps> = ({ sections }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ scrollBehavior: 'smooth' as const }}
    >
      {sections.map((section, index) => (
        <div key={section.id}>
          <ScrollSection
            section={section}
            index={index}
            scrollProgress={scrollYProgress}
          />
        </div>
      ))}
    </div>
  )
}

interface ScrollSectionProps {
  section: ScrollSection
  index: number
  scrollProgress: any
}

const ScrollSection: React.FC<ScrollSectionProps> = ({
  section,
  index,
  scrollProgress,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <motion.section
      ref={sectionRef}
      className={`relative min-h-screen flex items-center justify-center px-6 lg:px-16 py-20 overflow-hidden ${
        section.darkBg ? 'bg-black' : 'bg-gradient-to-b from-slate-900 to-black'
      }`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-96 h-96 gradient-glow rounded-full"
          animate={{
            rotate: 360,
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ opacity: 0.3 }}
        />
      </div>

      {/* Content container */}
      <motion.div
        ref={contentRef}
        className="relative z-10 w-full max-w-6xl"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: false, amount: 0.3 }}
      >
        {/* Section header */}
        <div className="space-y-6 mb-16">
          {section.title && (
            <motion.h2
              className="text-4xl lg:text-5xl font-black text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: false }}
            >
              <span className="gradient-text">{section.title}</span>
            </motion.h2>
          )}
          {section.subtitle && (
            <motion.p
              className="text-lg text-gray-400 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: false }}
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
          viewport={{ once: false }}
        >
          {section.content}
        </motion.div>
      </motion.div>

      {/* Bottom accent */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-cyan-400 to-transparent"
        animate={{ height: [64, 96, 64] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.section>
  )
}

export default ScrollSections
