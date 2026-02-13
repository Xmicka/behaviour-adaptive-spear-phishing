import React, { useEffect, useState } from 'react'
import { fetchOverview } from '../api/client'
import ShieldScene from './ShieldScene'
import PipelineStepper from '../components/PipelineStepper'

// Executive dashboard: premium, dark-themed summary for IT Heads / Owners
export default function Overview(){
  const [overview, setOverview] = useState<any>(null)

  useEffect(()=>{
    fetchOverview().then(setOverview)
  },[])

  return (
    <main className="container-md p-6">
      <div className="flex items-start gap-6 mb-6">
        <div style={{flex:'1 1 0'}}>
          <h1 className="text-2xl font-semibold mb-1">Security Executive Dashboard</h1>
          <p className="muted">High-level view of spear-phishing exposure and training progress. Designed for quick decision-making.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card panel-quiet">
              <div className="muted text-xs">Total users simulated</div>
              <div className="text-2xl font-bold mt-1">{overview?.totalUsers ?? '—'}</div>
            </div>
            <div className="card panel-quiet">
              <div className="muted text-xs">High-risk users</div>
              <div className="text-2xl font-bold mt-1">{overview?.highRisk ?? '—'}</div>
            </div>
            <div className="card panel-quiet">
              <div className="muted text-xs">Active training sessions</div>
              <div className="text-2xl font-bold mt-1">{overview?.activeTraining ?? '—'}</div>
            </div>
          </div>
        </div>

        <div style={{width:360}} className="card panel-quiet flex flex-col items-center">
          <div style={{width:280,height:220}}>
            <ShieldScene avgRisk={overview?.avgRisk ?? 0.42} />
          </div>
          <div className="mt-3 muted text-sm">Average risk: <strong className="accent">{((overview?.avgRisk ?? 0)*100).toFixed(0)}%</strong></div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-3">Security Pipeline</h2>
        <div className="card p-4">
          <PipelineStepper />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Executive Notes</h2>
        <div className="card panel-quiet p-4 muted">This dashboard surfaces aggregated risk signals and the training throughput. Use the Simulation and Training pages to run targeted exercises and inspect remediation impact over time.</div>
      </section>
    </main>
  )
}
