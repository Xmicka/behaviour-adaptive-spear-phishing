import React, { useEffect, useState } from 'react'
import { fetchPipeline } from '../api/client'

export default function OutcomePipeline(){
  const [stages, setStages] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(()=>{
    fetchPipeline().then(setStages)
  },[])

  return (
    <div className="p-6">
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-3">Simulation Outcome Pipeline</div>
        <div className="flex gap-3 items-center overflow-auto">
          {stages.map(s => (
            <div key={s.stage} onClick={()=>setSelected(s.stage)} className={`p-4 min-w-[120px] rounded cursor-pointer ${selected===s.stage? 'ring-2 ring-[var(--accent)]': 'bg-black/10'}`}>
              <div className="text-xs text-gray-400">{s.stage}</div>
              <div className="text-xl font-semibold">{s.count}</div>
            </div>
          ))}
        </div>
        {selected && <div className="mt-4 text-sm text-gray-300">Selected stage: <strong>{selected}</strong> — click blocks to inspect counts and progression.</div>}
      </div>
    </div>
  )
}
