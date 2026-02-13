import React from 'react'
import TrainingDecision from './TrainingDecision'

// Training overview for IT heads: shows micro-training and mandatory assigned training
export default function TrainingOverview(){
  // Use a demo risk score for the overview; in production this aggregates user events
  const demoRisk = 0.72

  return (
    <main className="container-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Training Overview</h1>
      <p className="muted mb-4">Review recent micro-training triggers and mandatory assignments. This helps measure behavior change and compliance.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card panel-quiet p-4">
          <div className="text-sm muted">Risk threshold evaluation</div>
          <div className="mt-2 text-lg font-semibold">Current example risk: <span className="accent">{demoRisk.toFixed(2)}</span></div>
        </div>
        <div className="card">
          <TrainingDecision riskScore={demoRisk} />
        </div>
      </div>
    </main>
  )
}
