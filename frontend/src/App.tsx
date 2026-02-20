import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import RequireAuth from './auth/RequireAuth'

export default function App(){
  return (
    <div className="min-h-screen text-gray-200">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
