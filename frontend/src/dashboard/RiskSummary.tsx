import React from 'react'

export default function RiskSummary({score}:{score:number}){
  const label = score >= 0.66 ? 'High' : score >= 0.4 ? 'Medium' : 'Low'
  const color = score >= 0.66 ? 'text-red-400' : score >= 0.4 ? 'text-yellow-300' : 'text-green-300'
  return (
    <div className="card p-3">
      <div className="text-sm text-gray-400">Organization risk</div>
      <div className={`text-2xl font-semibold ${color}`}>{label} — {score.toFixed(2)}</div>
    </div>
  )
}
