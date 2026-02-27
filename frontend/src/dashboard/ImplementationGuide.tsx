import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { startAutoPipeline, stopAutoPipeline, fetchSchedulerStatus, type SchedulerStatus } from '../api/client'

const ImplementationGuide: React.FC = () => {
    const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
    const [toggling, setToggling] = useState(false)

    useEffect(() => {
        fetchSchedulerStatus().then(setSchedulerStatus)
        const interval = setInterval(() => fetchSchedulerStatus().then(setSchedulerStatus), 10000)
        return () => clearInterval(interval)
    }, [])

    const toggleScheduler = async () => {
        setToggling(true)
        if (schedulerStatus?.running) {
            await stopAutoPipeline()
        } else {
            await startAutoPipeline(5)
        }
        const status = await fetchSchedulerStatus()
        setSchedulerStatus(status)
        setToggling(false)
    }

    const sections = [
        {
            icon: '🏗️',
            title: 'System Architecture',
            content: (
                <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                    <p>The platform consists of three interconnected components:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="font-semibold text-cyan-400 mb-1">🌐 Browser Extension</div>
                            <p className="text-xs">Captures behavioral metadata (navigation, clicks, typing speed) from employee browsers. No passwords or content.</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="font-semibold text-cyan-400 mb-1">⚙️ Backend Pipeline</div>
                            <p className="text-xs">Runs Isolation Forest ML to detect anomalies, compute risk scores, and auto-send phishing simulations.</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="font-semibold text-cyan-400 mb-1">📊 This Dashboard</div>
                            <p className="text-xs">Shows real-time risk posture, email outcomes, training status, and user state lifecycle.</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: '🔄',
            title: 'Automated Pipeline',
            content: (
                <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                    <p>The pipeline runs autonomously with <strong>zero admin intervention</strong>:</p>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {['Behavior Data', '→', 'Risk Scoring', '→', 'Phishing Email', '→', 'Click Detection', '→', 'Training'].map((step, i) => (
                            <span key={i} className={step === '→' ? 'text-gray-500' : 'bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-full text-blue-300 font-medium'}>
                                {step}
                            </span>
                        ))}
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 mt-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">Auto-Pipeline</span>
                            <button
                                onClick={toggleScheduler}
                                disabled={toggling}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${schedulerStatus?.running
                                    ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                                    : 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                                    } ${toggling ? 'opacity-50' : ''}`}
                            >
                                {toggling ? '...' : schedulerStatus?.running ? '⏹ Stop' : '▶ Start'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400">
                            {schedulerStatus?.running
                                ? '✅ Running — pipeline auto-executes every 5 minutes'
                                : '⏸ Stopped — click Start to enable autonomous operation'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            icon: '📈',
            title: 'Understanding Risk Scores',
            content: (
                <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                    <p>Risk scores range from <strong>0.0</strong> (very low risk) to <strong>1.0</strong> (very high risk), computed by the Isolation Forest ML model based on:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-2 text-center">
                            <div className="font-bold text-green-400 text-lg">{'< 0.3'}</div>
                            <div className="text-green-300">Low Risk</div>
                            <div className="text-gray-400 mt-1">Normal behavior — no action</div>
                        </div>
                        <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-2 text-center">
                            <div className="font-bold text-yellow-400 text-lg">0.3 – 0.6</div>
                            <div className="text-yellow-300">Medium Risk</div>
                            <div className="text-gray-400 mt-1">Micro-training recommended</div>
                        </div>
                        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-2 text-center">
                            <div className="font-bold text-red-400 text-lg">{'≥ 0.6'}</div>
                            <div className="text-red-300">High Risk</div>
                            <div className="text-gray-400 mt-1">Mandatory training + phishing sim</div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: '🎓',
            title: 'Training Lifecycle',
            content: (
                <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                    <p>Each user progresses through a <strong>7-state lifecycle</strong>:</p>
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                        {[
                            { state: 'CLEAN', color: 'bg-gray-600/30 text-gray-300' },
                            { state: '→' },
                            { state: 'PHISH_SENT', color: 'bg-blue-600/30 text-blue-300' },
                            { state: '→' },
                            { state: 'PHISH_CLICKED', color: 'bg-red-600/30 text-red-300' },
                            { state: '→' },
                            { state: 'MICRO_TRAINING', color: 'bg-orange-600/30 text-orange-300' },
                            { state: '→' },
                            { state: 'MANDATORY', color: 'bg-yellow-600/30 text-yellow-300' },
                            { state: '→' },
                            { state: 'COMPLIANT', color: 'bg-green-600/30 text-green-300' },
                        ].map((s, i) => (
                            <span key={i} className={s.color ? `${s.color} px-2 py-1 rounded-full border border-white/10 font-medium` : 'text-gray-500'}>
                                {s.state}
                            </span>
                        ))}
                    </div>
                    <ul className="list-disc list-inside text-xs text-gray-400 space-y-1 mt-2">
                        <li>Users who <strong>report</strong> phishing skip directly to COMPLIANT</li>
                        <li>Training is enforced automatically — no manual admin intervention needed</li>
                        <li>After completing both training stages, users may be re-tested in a new cycle</li>
                    </ul>
                </div>
            ),
        },
        {
            icon: '🔧',
            title: 'Deploying the Extension',
            content: (
                <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                    <p>Three deployment options available:</p>
                    <ol className="list-decimal list-inside text-xs text-gray-400 space-y-2">
                        <li><strong className="text-gray-200">Manual Install:</strong> Distribute the extension ZIP → employees load as unpacked in Chrome</li>
                        <li><strong className="text-gray-200">Chrome Web Store:</strong> Upload as unlisted → share direct install link with employees</li>
                        <li><strong className="text-gray-200">Group Policy:</strong> Use Google Workspace or Windows GPO to force-install across all managed browsers</li>
                    </ol>
                    <div className="pt-2">
                        <a
                            href="/adaptive-security-extension.zip"
                            download
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all"
                        >
                            <span className="text-lg">⬇️</span> Download Extension (ZIP)
                        </a>
                    </div>
                </div>
            ),
        },
        {
            icon: '❓',
            title: 'FAQ',
            content: (
                <div className="space-y-3 text-xs text-gray-400">
                    <details className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <summary className="text-gray-200 cursor-pointer font-medium">Does the extension capture passwords?</summary>
                        <p className="mt-2">No. The extension only captures metadata — page URLs, click targets, typing speed. No passwords, form values, or clipboard content is ever captured.</p>
                    </details>
                    <details className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <summary className="text-gray-200 cursor-pointer font-medium">Can employees disable the extension?</summary>
                        <p className="mt-2">If installed manually, yes. With Group Policy deployment, the extension is force-installed and cannot be disabled by the user.</p>
                    </details>
                    <details className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <summary className="text-gray-200 cursor-pointer font-medium">How often does the pipeline run?</summary>
                        <p className="mt-2">When auto-pipeline is enabled, it checks for new behavioral data every 5 minutes and runs the full cycle if new events are detected.</p>
                    </details>
                    <details className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <summary className="text-gray-200 cursor-pointer font-medium">What happens when a user clicks a phishing link?</summary>
                        <p className="mt-2">They're immediately shown a micro-training page explaining the red flags they missed. After completing micro-training, they receive a mandatory security awareness training link. Their state changes to COMPLIANT once both are done.</p>
                    </details>
                    <details className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <summary className="text-gray-200 cursor-pointer font-medium">What if SMTP isn't configured?</summary>
                        <p className="mt-2">The system runs in "log-only" mode — emails are fully generated and logged but not actually sent. This is useful for testing and development.</p>
                    </details>
                </div>
            ),
        },
    ]

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📋</span>
                <div>
                    <h2 className="text-xl font-bold text-white">Implementation Guide</h2>
                    <p className="text-sm text-gray-400">For administrators and security officers</p>
                </div>
            </div>

            <div className="space-y-4">
                {sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{section.icon}</span>
                            <h3 className="text-base font-semibold text-white">{section.title}</h3>
                        </div>
                        {section.content}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default ImplementationGuide
