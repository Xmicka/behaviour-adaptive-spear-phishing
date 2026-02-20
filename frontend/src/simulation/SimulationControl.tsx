import React, { useState } from 'react'
import { generateEmail, fetchMicroTrainingForRisk } from '../api/client'
import EmailPreview from './EmailPreview'
import MicroTrainingModal from '../components/MicroTrainingModal'
import { motion } from 'framer-motion'

const THEMES = ['Invoice','HR Update','IT Alert']

export default function SimulationControl(){
  const [theme, setTheme] = useState(THEMES[0])
  const [email, setEmail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [incidentType, setIncidentType] = useState('')

  async function handleGenerate(){
    setLoading(true)
    try{
      const result = await generateEmail(theme)
      setEmail(result)
    }finally{
      setLoading(false)
    }
  }

  async function handleSimulateUserInteraction(){
    if(!email) return
    setLoading(true)
    try{
      const training = await fetchMicroTrainingForRisk(email.risk_score)
      // decide whether to trigger micro-training based on threshold
      const threshold = training.threshold ?? 0.66
      const incident = email.target_behavior || 'Clicked Malicious Link'
      setIncidentType(incident)
      if(email.risk_score >= threshold){
        setModalOpen(true)
      } else {
        // show confirmation small toast (kept simple)
        alert('Simulated interaction: no micro-training required for this risk tier.')
      }
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-400">Spear Phishing Generator</div>
          <div className="mt-3">
            <select value={theme} onChange={(e)=>setTheme(e.target.value)} className="w-full p-2 rounded bg-black/20">
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="mt-3 flex justify-end">
              <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-[var(--accent)] text-black rounded">Generate Spear Phishing Email</button>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            {email ? <EmailPreview subject={email.subject} body={email.body} /> : <div className="text-sm text-gray-400">No generated email yet. Use themes to simulate targeted messages.</div>}
            {email && (
              <div className="mt-3 text-sm text-gray-300">
                <div><strong>Why this targets behavior:</strong> {email.target_behavior}</div>
                <div className="mt-2"><strong>Estimated tier:</strong> {email.risk_score >= 0.66 ? 'High' : email.risk_score >= 0.3 ? 'Medium' : 'Low'}</div>
              </div>
            )}

            {email && (
              <div className="mt-3 flex gap-2">
                <button onClick={handleSimulateUserInteraction} disabled={loading} className="px-4 py-2 bg-[var(--accent)] text-black rounded">Simulate User Interaction</button>
                <button onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(email)); alert('Copied sample payload')}} className="px-4 py-2 bg-white/5 text-gray-200 rounded">Copy Payload</button>
              </div>
            )}

            <MicroTrainingModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} employeeName={'Demo User'} incidentType={incidentType} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
