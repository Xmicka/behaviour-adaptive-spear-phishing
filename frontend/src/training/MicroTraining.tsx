import React from 'react'

export default function MicroTraining({why, advice, videoId}:{why:string; advice:string; videoId:string}){
  return (
    <div className="p-6">
      <div className="card">
        <div className="text-sm text-gray-400">Micro-Training — Explainable remediation</div>
        <div className="mt-3">
          <div className="text-sm"><strong>What went wrong:</strong> {why}</div>
          <div className="mt-2 text-sm"><strong>Why risky:</strong> Social-engineering techniques exploit trust and urgency; attackers mimic real workflows to bypass heuristics.</div>
          <div className="mt-2 text-sm"><strong>Advice:</strong> {advice}</div>
          <div className="mt-4">
            <div className="text-sm text-gray-400">Mandatory follow-up video</div>
            <div className="mt-2">
              <iframe width="560" height="315" src={`https://www.youtube.com/embed/${videoId}`} title="Micro-training video" className="w-full h-48"></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
