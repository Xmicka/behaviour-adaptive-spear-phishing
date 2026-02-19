import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

interface RiskEmployee {
  id: string
  name: string
  email: string
  riskScore: number
  lastIncident: string
  status: 'critical' | 'high' | 'medium' | 'low'
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<RiskEmployee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<RiskEmployee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      navigate('/login')
      return
    }

    // Simulate loading dashboard data
    setTimeout(() => {
      const mockEmployees: RiskEmployee[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          email: 'sarah.chen@company.com',
          riskScore: 78,
          lastIncident: '2 hours ago',
          status: 'critical',
        },
        {
          id: '2',
          name: 'James Mitchell',
          email: 'james.mitchell@company.com',
          riskScore: 62,
          lastIncident: '1 day ago',
          status: 'high',
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily.r@company.com',
          riskScore: 45,
          lastIncident: '3 days ago',
          status: 'medium',
        },
        {
          id: '4',
          name: 'Michael Park',
          email: 'michael.park@company.com',
          riskScore: 28,
          lastIncident: '1 week ago',
          status: 'low',
        },
        {
          id: '5',
          name: 'Jessica Brown',
          email: 'jessica.brown@company.com',
          riskScore: 85,
          lastIncident: '30 minutes ago',
          status: 'critical',
        },
      ]
      setEmployees(mockEmployees)
      setIsLoading(false)
    }, 1000)
  }, [navigate])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'from-red-500 to-red-600'
      case 'high':
        return 'from-orange-500 to-orange-600'
      case 'medium':
        return 'from-yellow-500 to-yellow-600'
      case 'low':
        return 'from-green-500 to-green-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500/10'
      case 'high':
        return 'bg-orange-500/10'
      case 'medium':
        return 'bg-yellow-500/10'
      case 'low':
        return 'bg-green-500/10'
      default:
        return 'bg-gray-500/10'
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'border-red-500/30'
      case 'high':
        return 'border-orange-500/30'
      case 'medium':
        return 'border-yellow-500/30'
      case 'low':
        return 'border-green-500/30'
      default:
        return 'border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="pt-24 pb-16 px-6 lg:px-16">
        {/* Animated background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 gradient-glow rounded-full"
            animate={{ y: [0, 40, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-96 h-96 gradient-glow rounded-full"
            animate={{ y: [0, -40, 0], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black text-white">
              Security <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Real-time organizational risk assessment and employee threat monitoring
            </p>
          </motion.div>

          {/* Key metrics grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          >
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="glass h-32 rounded-xl animate-pulse"
                  />
                ))}
              </>
            ) : (
              <>
                <MetricCard
                  label="Organizational Risk"
                  value="62%"
                  trend="↑ 8%"
                  color="from-red-500 to-orange-500"
                />
                <MetricCard
                  label="At-Risk Employees"
                  value={employees.length}
                  trend="2 critical"
                  color="from-orange-500 to-yellow-500"
                />
                <MetricCard
                  label="Active Campaigns"
                  value="3"
                  trend="2 ongoing"
                  color="from-cyan-500 to-blue-500"
                />
                <MetricCard
                  label="Training Completed"
                  value="84%"
                  trend="↑ 12%"
                  color="from-green-500 to-emerald-500"
                />
              </>
            )}
          </motion.div>

          {/* Main grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-white">Employee Risk Scores</h2>
              <div className="glass rounded-xl overflow-hidden">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <motion.div
                        className="w-8 h-8 border-3 border-transparent border-t-cyan-400 rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="divide-y divide-white/5"
                    >
                      {employees.map((employee, idx) => (
                        <RiskRow
                          key={employee.id}
                          employee={employee}
                          index={idx}
                          isSelected={selectedEmployee?.id === employee.id}
                          onSelect={setSelectedEmployee}
                          statusColor={getStatusColor(employee.status)}
                          statusBgColor={getStatusBgColor(employee.status)}
                          statusBorderColor={getStatusBorderColor(employee.status)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Detail panel */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Details</h2>
              <AnimatePresence mode="wait">
                {selectedEmployee ? (
                  <EmployeeDetailPanel
                    employee={selectedEmployee}
                    statusColor={getStatusColor(selectedEmployee.status)}
                    statusBgColor={getStatusBgColor(selectedEmployee.status)}
                    statusBorderColor={getStatusBorderColor(selectedEmployee.status)}
                  />
                ) : (
                  <motion.div
                    key="empty"
                    className="glass rounded-xl p-8 text-center text-gray-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <p>Select an employee to view details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Campaign status */}
          <motion.div variants={itemVariants} className="glass rounded-xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Phishing Campaigns</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { name: 'Q1 2024 Finance', progress: 68, status: 'Active' },
                { name: 'HR Policy Update', progress: 92, status: 'Completing' },
                { name: 'Banking Security', progress: 45, status: 'Active' },
              ].map((campaign, idx) => (
                <motion.div
                  key={idx}
                  className="space-y-3 p-4 bg-white/5 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{campaign.name}</p>
                      <p className="text-xs text-gray-400">{campaign.status}</p>
                    </div>
                    <span className="text-lg font-bold gradient-text">{campaign.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.progress}%` }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

const MetricCard: React.FC<{
  label: string
  value: string | number
  trend: string
  color: string
}> = ({ label, value, trend, color }) => (
  <motion.div
    className={`glass rounded-xl p-6 space-y-4 group hover:ring-2 hover:ring-cyan-400/50 transition-all`}
    whileHover={{ translateY: -5 }}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {value}
        </p>
      </div>
    </div>
    <div className="pt-2 border-t border-white/10">
      <p className="text-xs text-gray-500">{trend}</p>
    </div>
  </motion.div>
)

const RiskRow: React.FC<{
  employee: RiskEmployee
  index: number
  isSelected: boolean
  onSelect: (emp: RiskEmployee) => void
  statusColor: string
  statusBgColor: string
  statusBorderColor: string
}> = ({
  employee,
  index,
  isSelected,
  onSelect,
  statusColor,
  statusBgColor,
  statusBorderColor,
}) => (
  <motion.div
    className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${
      isSelected ? 'bg-cyan-400/5 border-l-2 border-cyan-400' : ''
    }`}
    onClick={() => onSelect(employee)}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ x: 4 }}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-1 flex-1">
        <p className="font-semibold text-white">{employee.name}</p>
        <p className="text-xs text-gray-400">{employee.email}</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className={`px-3 py-1 rounded-full ${statusBgColor} border ${statusBorderColor}`}>
          <p className={`text-sm font-bold bg-gradient-to-r ${statusColor} bg-clip-text text-transparent`}>
            {employee.riskScore}
          </p>
        </div>
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{
            background: `linear-gradient(to right, ${
              statusColor === 'from-red-500 to-red-600'
                ? '#ef4444'
                : statusColor === 'from-orange-500 to-orange-600'
                  ? '#f97316'
                  : statusColor === 'from-yellow-500 to-yellow-600'
                    ? '#eab308'
                    : '#22c55e'
            })`,
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>
  </motion.div>
)

const EmployeeDetailPanel: React.FC<{
  employee: RiskEmployee
  statusColor: string
  statusBgColor: string
  statusBorderColor: string
}> = ({ employee, statusColor, statusBgColor, statusBorderColor }) => (
  <motion.div
    className="glass rounded-xl p-6 space-y-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="space-y-2">
      <p className="text-sm text-gray-400">Employee</p>
      <p className="text-xl font-bold text-white">{employee.name}</p>
      <p className="text-sm text-gray-500">{employee.email}</p>
    </div>

    <div className="pt-4 border-t border-white/10 space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-400">Risk Score</p>
          <p className={`font-bold bg-gradient-to-r ${statusColor} bg-clip-text text-transparent`}>
            {employee.riskScore}%
          </p>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${statusColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${employee.riskScore}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      <div className={`px-3 py-2 rounded-lg ${statusBgColor} border ${statusBorderColor}`}>
        <p className="text-xs font-semibold text-gray-300 capitalize">{employee.status}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Last Incident</p>
        <p className="text-sm text-gray-300">{employee.lastIncident}</p>
      </div>
    </div>

    <motion.button
      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-lg text-sm"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Assign Training
    </motion.button>
  </motion.div>
)

export default Dashboard
