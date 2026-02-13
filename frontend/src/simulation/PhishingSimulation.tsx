import React from 'react'
import SimulationControl from './SimulationControl'
import OutcomePipeline from './OutcomePipeline'

// Phishing Simulation page: compose generator + live pipeline
export default function PhishingSimulation(){
  return (
    <main className="container-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Phishing Simulation</h1>
      <p className="muted mb-4">Generate demo-only spear-phishing examples and observe how they progress through the security pipeline.</p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <SimulationControl />
        </div>
        <div className="card">
          <OutcomePipeline />
        </div>
      </div>
    </main>
  )
}
