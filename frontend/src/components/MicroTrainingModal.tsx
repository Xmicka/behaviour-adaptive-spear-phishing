import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MicroTrainingModalProps {
  isOpen: boolean
  onClose: () => void
  employeeName: string
  incidentType: string
}

const MicroTrainingModal: React.FC<MicroTrainingModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  incidentType,
}) => {
  const [step, setStep] = useState<'intro' | 'training' | 'complete'>('intro')
  const [isAnswered, setIsAnswered] = useState(false)

  const handleStartTraining = () => {
    setStep('training')
    setIsAnswered(false)
  }

  const handleAnswer = () => {
    setIsAnswered(true)
    setTimeout(() => {
      setStep('complete')
    }, 1000)
  }

  const handleClose = () => {
    setStep('intro')
    setIsAnswered(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
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
              {/* Close button */}
              <motion.button
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  className="w-6 h-6 text-gray-400"
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

              <AnimatePresence mode="wait">
                {step === 'intro' && (
                  <motion.div
                    key="intro"
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-2">
                      <div className="text-5xl">⚠️</div>
                      <h2 className="text-3xl font-black text-white">
                        Micro-Training Required
                      </h2>
                      <p className="text-gray-400">
                        Hi <span className="text-cyan-400 font-semibold">{employeeName}</span>, a security incident was detected. Let's review best practices.
                      </p>
                    </div>

                    <div className="space-y-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm font-semibold text-red-400">
                        Incident Type: {incidentType}
                      </p>
                      <p className="text-xs text-gray-400">
                        This micro-training takes 2 minutes and is required before continuing.
                      </p>
                    </div>

                    <motion.button
                      onClick={handleStartTraining}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start Training
                    </motion.button>

                    <p className="text-xs text-gray-500 text-center">
                      After this, you'll receive a full training module
                    </p>
                  </motion.div>
                )}

                {step === 'training' && (
                  <motion.div
                    key="training"
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white">
                        {incidentType === 'Clicked Malicious Link'
                          ? 'Identifying Suspicious Links'
                          : 'Recognizing Phishing Emails'}
                      </h3>

                      <div className="space-y-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        {incidentType === 'Clicked Malicious Link' ? (
                          <>
                            <p className="text-sm text-gray-300">
                              <span className="text-cyan-400 font-semibold">✓</span> Always hover over links before clicking to see the actual URL
                            </p>
                            <p className="text-sm text-gray-300">
                              <span className="text-cyan-400 font-semibold">✓</span> Be suspicious of urgent calls-to-action or unusual requests
                            </p>
                            <p className="text-sm text-gray-300">
                              <span className="text-cyan-400 font-semibold">✓</span> When in doubt, navigate directly to the official website
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-300">
                              <span className="text-cyan-400 font-semibold">✓</span> Check sender email address carefully - slight misspellings are common
                            </p>
                            <p className="text-sm text-gray-300">
                              <span className="text-cyan-400 font-semibold">✓</span> Legitimate companies won't ask for passwords via email
                            </p>
                            <p className="text-sm text-gray-300">
                              <span className="text-cyan-400 font-semibold">✓</span> Report suspicious emails to your security team immediately
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-300">
                        Question: What should you do if you're unsure about an email?
                      </p>
                      <div className="space-y-2">
                        <motion.button
                          onClick={handleAnswer}
                          disabled={isAnswered}
                          className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-cyan-400/5 transition-colors disabled:opacity-50"
                          whileHover={{ x: 5 }}
                        >
                          Report it to the security team
                        </motion.button>
                        <motion.button
                          onClick={() => handleAnswer()}
                          disabled={isAnswered}
                          className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-red-400 hover:bg-red-400/5 transition-colors disabled:opacity-50"
                          whileHover={{ x: 5 }}
                        >
                          Delete it immediately
                        </motion.button>
                      </div>
                    </div>

                    {isAnswered && (
                      <motion.div
                        className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        ✓ Correct! Always report suspicious emails first.
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 'complete' && (
                  <motion.div
                    key="complete"
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="text-center space-y-2">
                      <motion.div
                        className="text-6xl mx-auto w-16 h-16 flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6 }}
                      >
                        ✓
                      </motion.div>
                      <h3 className="text-2xl font-black text-white">
                        Training Complete!
                      </h3>
                      <p className="text-gray-400">
                        Great job! You've completed the micro-training.
                      </p>
                    </div>

                    <div className="space-y-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <p className="text-sm font-semibold text-gray-300">Next Step:</p>
                      <p className="text-sm text-gray-400">
                        You'll receive an email with a full 15-minute training course to deepen your security awareness. Please complete it within 48 hours.
                      </p>
                      <a
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                      >
                        → Click here for full training
                      </a>
                    </div>

                    <motion.button
                      onClick={handleClose}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Close
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MicroTrainingModal
