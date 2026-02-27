import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import PremiumDashboard from './pages/PremiumDashboard'
import RequireAuth from './auth/RequireAuth'

import Login from './auth/Login'

export default function App() {
  return (
    <div className="min-h-screen text-gray-200">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login isOpen={true} onClose={() => window.location.href = '/'} />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/dashboard-premium" element={<RequireAuth><PremiumDashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
