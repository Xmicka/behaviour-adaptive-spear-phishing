import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Campaign, fetchCampaigns, createCampaign, fetchEmailScenarios } from '../api/client'

const CampaignManager: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [scenarios, setScenarios] = useState<string[]>([])

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        target_tier: 'High',
        scenario: 'credential_harvest',
        scheduled_for: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 5000)

        try {
            setLoading(true)
            const [campaignList, scenarioData] = await Promise.all([
                fetchCampaigns(),
                fetchEmailScenarios()
            ])
            setCampaigns(campaignList)
            if (scenarioData) {
                // Flatten scenarios object values into a single array
                const allScenarios = Object.values(scenarioData).flat()
                setScenarios(allScenarios)
            }
            setLoading(false)
        } catch (err) {
            console.error('Campaign data fetch error:', err)
            setLoading(false)
        } finally {
            clearTimeout(timeout)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const res = await createCampaign(formData)
        if (res.status === 'created') {
            setShowCreateModal(false)
            setFormData({ name: '', target_tier: 'High', scenario: 'credential_harvest', scheduled_for: '' })
            loadData()
        }
        setSubmitting(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white">Phishing Campaigns</h2>
                    <p className="text-slate-400">Automated and manual simulation management</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn px-6 py-2.5 flex items-center shadow-lg shadow-cyan-500/20"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    New Campaign
                </button>
            </div>

            <div className="glass-dark rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaign Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Scenario</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-4 h-16 bg-slate-900/50"></td>
                                </tr>
                            ))
                        ) : campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                    No active campaigns found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            campaigns.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.target_tier === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            c.target_tier === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                'bg-green-500/10 text-green-500 border border-green-500/20'
                                            }`}>
                                            {c.target_tier} Risk
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 capitalize">{c.scenario.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full mr-2 ${c.status === 'active' ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50 animate-pulse' : 'bg-slate-500'}`} />
                                            <span className="text-slate-300 capitalize">{c.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Automation Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-dark p-6 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Autonomous Phishing Pipeline
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">The system automatically targets high-risk users based on their behavioral baseline deviations. No manual campaign needed for critical coverage.</p>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 uppercase font-semibold">Risk Threshold</span>
                            <span className="text-cyan-400 font-mono">0.60</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full w-[60%]" />
                        </div>
                    </div>
                </div>

                <div className="glass-dark p-6 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Automatic Retraining
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">Simulation click detection is wired directly into the micro-training enforcement engine. Compliance is tracked per campaign.</p>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-lg font-bold text-white">100%</div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Enforcement</div>
                        </div>
                        <div className="text-center border-l border-slate-800 pl-4">
                            <div className="text-lg font-bold text-white">Auto</div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Correction</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-8 shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">New Phishing Campaign</h3>
                            <p className="text-slate-400 text-sm mb-6">Define a targeted simulation group and attack vector.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Campaign Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Q1 Security Awareness Test"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Tier</label>
                                        <select
                                            value={formData.target_tier}
                                            onChange={e => setFormData({ ...formData, target_tier: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                                        >
                                            <option>High</option>
                                            <option>Medium</option>
                                            <option>Low</option>
                                            <option value="All">All Employees</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Attack Scenario</label>
                                        <select
                                            value={formData.scenario}
                                            onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                                        >
                                            {scenarios.map(s => (
                                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Schedule (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_for}
                                        onChange={e => setFormData({ ...formData, scheduled_for: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 px-4 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                                    >
                                        {submitting ? 'Creating...' : 'Start Campaign'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CampaignManager
