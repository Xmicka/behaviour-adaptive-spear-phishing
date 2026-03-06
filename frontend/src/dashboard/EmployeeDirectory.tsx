import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Employee, fetchEmployees, sendEmployeeSimulation, sendWarningEmail } from '../api/client'
import LoginBehaviorChart from './LoginBehaviorChart'

const EmployeeDirectory: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Simulation Modal State
    const [showSimModal, setShowSimModal] = useState(false)
    const [scenario, setScenario] = useState('credential_harvest')
    const [simLoading, setSimLoading] = useState(false)

    useEffect(() => {
        loadEmployees()
    }, [])

    const loadEmployees = async () => {
        setLoading(true)
        const data = await fetchEmployees()
        setEmployees(data)
        setLoading(false)
    }

    const handleSendSimulation = async () => {
        if (!selectedEmployee) return

        setSimLoading(true)
        setStatusMessage(null)

        try {
            const result = await sendEmployeeSimulation(selectedEmployee.user_id, scenario)
            if (result && result.sent) {
                setStatusMessage({ type: 'success', text: `Phishing simulation sent to ${selectedEmployee.email}` })
                setShowSimModal(false)
            } else {
                setStatusMessage({ type: 'error', text: result?.error || 'Failed to send simulation' })
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: 'An unexpected error occurred' })
        } finally {
            setSimLoading(false)
        }
    }

    const handleSendWarning = async (e: React.MouseEvent, emp: Employee) => {
        e.stopPropagation()
        if (!window.confirm(`Send an automated security warning email to ${emp.name}?`)) return

        try {
            const res = await sendWarningEmail(emp.user_id, 'Admin triggered review')
            if (res && res.status === 'sent') {
                setStatusMessage({ type: 'success', text: `Warning email sent to ${emp.email}` })
            } else {
                setStatusMessage({ type: 'error', text: res?.error || 'Failed to send warning' })
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: 'Error sending warning' })
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRiskColor = (tier?: string) => {
        switch (tier) {
            case 'High': return 'text-red-400 bg-red-400/10 border-red-500/20'
            case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20'
            case 'Low': return 'text-green-400 bg-green-400/10 border-green-500/20'
            default: return 'text-slate-400 bg-slate-800 border-slate-700'
        }
    }

    return (
        <div className="card glass relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
                        <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Employee Directory
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Manage personnel, review individual telemetry, and target simulations.</p>
                </div>

                <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {statusMessage && (
                <div className={`mb-6 p-3 rounded-lg border text-sm flex items-center justify-between ${statusMessage.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center text-slate-500 animate-pulse">Loading directory data...</div>
            ) : employees.length === 0 ? (
                <div className="py-16 text-center border-2 border-slate-800 border-dashed rounded-xl">
                    <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-300">No employees registered</h3>
                    <p className="text-slate-500 text-sm mt-1">Users will appear here once they install the browser extension.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Employee List */}
                    <div className="lg:col-span-1 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[600px] bg-slate-900/30">
                        <div className="p-3 border-b border-slate-800 bg-slate-900/80 font-medium text-xs text-slate-400 uppercase tracking-wider flex justify-between">
                            <span>Directory ({filteredEmployees.length})</span>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {filteredEmployees.map(emp => (
                                <div
                                    key={emp.user_id}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200 border
                    ${selectedEmployee?.user_id === emp.user_id
                                            ? 'bg-cyan-900/20 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.05)]'
                                            : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700'
                                        }
                  `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-slate-200 text-sm">{emp.name}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{emp.email}</p>
                                        </div>
                                        {emp.metrics?.anomaly_score > 0.8 && (
                                            <span className="flex h-2 w-2 relative" title="Elevated Anomaly Score">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRiskColor(emp.tier)}`}>
                                            {emp.tier || 'Pending'} Risk
                                        </span>
                                        <span className="text-[10px] text-slate-600">ID: {emp.employee_id || emp.user_id.substring(0, 8)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Employee Detail & Telemetry */}
                    <div className="lg:col-span-2 border border-slate-800 rounded-xl h-[600px] bg-slate-900/30 overflow-y-auto p-6 relative">
                        <AnimatePresence mode="wait">
                            {!selectedEmployee ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-slate-500"
                                >
                                    <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                    <p>Select an employee to view detailed behavioral telemetry</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="detail"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Header Profile */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-cyan-500 border border-slate-700">
                                                    {selectedEmployee.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{selectedEmployee.name}</h3>
                                                    <p className="text-sm text-slate-400">{selectedEmployee.email} • ID: {selectedEmployee.employee_id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={(e) => handleSendWarning(e, selectedEmployee)}
                                                className="flex-1 md:flex-none btn-ghost text-xs py-2 px-3 flex items-center justify-center hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Warn
                                            </button>
                                            <button
                                                onClick={() => setShowSimModal(true)}
                                                className="flex-1 md:flex-none btn text-xs py-2 px-4 shadow-lg shadow-cyan-500/20"
                                            >
                                                <svg className="w-4 h-4 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                Target Simulation
                                            </button>
                                        </div>
                                    </div>

                                    {/* Top Stats Row */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="glass-dark p-4 rounded-xl border border-slate-700 text-center">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Risk Score</div>
                                            <div className={`text-2xl font-bold ${getRiskColor(selectedEmployee.tier).split(' ')[0]}`}>
                                                {(selectedEmployee.risk_score || 0).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="glass-dark p-4 rounded-xl border border-slate-700 text-center">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Anomaly</div>
                                            <div className="text-2xl font-bold text-white">
                                                {((selectedEmployee.metrics?.anomaly_score || 0) * 100).toFixed(0)}%
                                            </div>
                                        </div>

                                        <div className="glass-dark p-4 rounded-xl border border-slate-700 text-center">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Failed Logins</div>
                                            <div className="text-2xl font-bold text-white">
                                                {((selectedEmployee.metrics?.failed_login_ratio || 0) * 100).toFixed(0)}%
                                            </div>
                                        </div>

                                        <div className="glass-dark p-4 rounded-xl border border-slate-700 text-center">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Device ID</div>
                                            <div className="text-sm font-mono text-slate-300 mt-2 truncate" title={selectedEmployee.device_id}>
                                                {selectedEmployee.device_id || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Behavior Chart Component */}
                                    <div className="glass-dark p-4 rounded-xl border border-slate-800 mt-6">
                                        <LoginBehaviorChart userId={selectedEmployee.user_id} />
                                    </div>

                                    {/* ML Insights */}
                                    {selectedEmployee.metrics?.risk_reason && (
                                        <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-4 mt-6">
                                            <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Isolation Forest Assessment
                                            </h4>
                                            <p className="text-sm text-slate-300">{selectedEmployee.metrics.risk_reason}</p>
                                        </div>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Target Simulation Modal */}
            <AnimatePresence>
                {showSimModal && selectedEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Target Simulation</h3>
                            <p className="text-sm text-slate-400 mb-6">Dispatch a highly personalized spear-phishing test to <strong className="text-slate-200">{selectedEmployee.email}</strong> based on their telemetry profile.</p>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Attack Vector / Scenario</label>
                                    <select
                                        value={scenario}
                                        onChange={e => setScenario(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="credential_harvest">Credential Harvest (O365/Workspace)</option>
                                        <option value="malware_delivery">Malware Delivery (Invoice PDF)</option>
                                        <option value="urgent_action">Urgent Action (Wire Transfer/Payroll)</option>
                                        <option value="custom">Dynamic (AI selected based on behavior)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                                <button
                                    onClick={() => setShowSimModal(false)}
                                    disabled={simLoading}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendSimulation}
                                    disabled={simLoading}
                                    className="btn px-6 py-2 flex items-center"
                                >
                                    {simLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Dispatching...
                                        </>
                                    ) : 'Deploy Phish'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default EmployeeDirectory
