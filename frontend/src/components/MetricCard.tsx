import React from 'react'

export default function MetricCard({ title, value, sub }: { title: string; value: string | number; sub?: string }){
  return (
    <div className="card p-4 w-full">
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}
