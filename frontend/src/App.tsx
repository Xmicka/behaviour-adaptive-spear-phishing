import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './auth/Login'
import RequireAuth from './auth/RequireAuth'
import Overview from './dashboard/Overview'
import PhishingSimulation from './simulation/PhishingSimulation'
import TrainingOverview from './training/TrainingOverview'

export default function App(){
  return (
    <div className="min-h-screen text-gray-200">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Overview /></RequireAuth>} />
        <Route path="/simulation" element={<RequireAuth><PhishingSimulation /></RequireAuth>} />
        <Route path="/training" element={<RequireAuth><TrainingOverview /></RequireAuth>} />
      </Routes>
    </div>
  )
}
