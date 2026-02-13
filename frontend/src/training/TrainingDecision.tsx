import React, { useEffect, useState } from 'react'
import { fetchMicroTrainingForRisk } from '../api/client'
import MicroTraining from './MicroTraining'

export default function TrainingDecision({ riskScore }:{ riskScore:number }){
  const [data, setData] = useState<any>(null)

  useEffect(()=>{
    fetchMicroTrainingForRisk(riskScore).then(setData)
  },[riskScore])

  if(!data) return <div className="p-6"><div className="text-sm text-gray-400">Evaluating training need...</div></div>

  if(riskScore >= data.threshold){
    return <MicroTraining why={data.why} advice={data.advice} videoId={data.videoId} />
  }

  return <div className="p-6"><div className="card">No mandatory micro-training required. Risk below threshold.</div></div>
}
