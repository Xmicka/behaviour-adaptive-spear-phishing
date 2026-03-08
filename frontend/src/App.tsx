import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import AdminDashboard from './pages/AdminDashboard'
import RequireAuth from './auth/RequireAuth'

import Login from './auth/Login'

export default function App() {
  return (
    <div className="min-h-screen text-gray-200">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login isOpen={true} onClose={() => window.location.href = '/'} />} />
        <Route path="/dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
