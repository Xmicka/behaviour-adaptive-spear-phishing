import React, { useEffect, useState } from 'react'
import { fetchPipeline } from '../api/client'
import { motion } from 'framer-motion'

// Visual Security Pipeline stepper — horizontal flow, subtle motion
export default function PipelineStepper(){
  const [stages, setStages] = useState<{stage:string;count:number}[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(()=>{
    fetchPipeline().then(setStages)
  },[])

  const colorFor = (stage:string)=>{
    if(stage === 'Clicked' || stage === 'User Failed') return 'rgba(255,80,80,0.12)'
    if(stage === 'Micro Training' || stage === 'Training') return 'rgba(255,200,80,0.06)'
    if(stage === 'Resolved' || stage === 'Risk Score Generated') return 'rgba(40,220,180,0.06)'
    return 'rgba(255,255,255,0.02)'
  }

  return (
    <div>
      <div className="pipeline">
        {stages.map(s => (
          <motion.div layout key={s.stage} onClick={()=>setSelected(s.stage)} whileHover={{ y: -6 }} className="pipeline-step panel-quiet clickable" style={{background: colorFor(s.stage), border: selected===s.stage? '1px solid var(--accent)': undefined}}>
            <div className="label">{s.stage}</div>
            <div className="count">{s.count}</div>
          </motion.div>
        ))}
      </div>
      {selected && <div className="mt-3 muted">Selected: <strong className="accent">{selected}</strong></div>}
    </div>
  )
}
