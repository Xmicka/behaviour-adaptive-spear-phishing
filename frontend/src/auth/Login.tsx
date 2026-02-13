import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInWithEmailAndPassword } from '../firebase'
import { motion } from 'framer-motion'

// Login screen exists to ensure only authorized IT heads/SME owners access
// the admin dashboard. For demo, we authenticate against a hardcoded user list.
export default function Login(){
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('DemoPass123')
  const [error, setError] = useState<string| null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setError(null)
    try{
      await signInWithEmailAndPassword(email, password)
      navigate(from, { replace: true })
    }catch(err:any){
      setError(err.message || 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md mx-auto">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-2">Admin — Spear Phishing Simulation</h1>
          <p className="text-sm text-gray-400 mb-4">Sign in as the IT head / SME owner (demo)</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Email</label>
              <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full mt-1 p-2 rounded bg-black/20" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full mt-1 p-2 rounded bg-black/20" />
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-[var(--accent)] text-black font-medium">Sign in</button>
            </div>
          </form>
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center">Demo users: admin@example.com, owner@example.com (password: DemoPass123)</p>
      </motion.div>
    </div>
  )
}
