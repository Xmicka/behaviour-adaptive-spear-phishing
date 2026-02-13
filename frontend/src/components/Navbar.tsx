import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut, getCurrentUser } from '../firebase'

export default function Navbar(){
  const navigate = useNavigate()
  const user = getCurrentUser()

  async function handleSignOut(){
    await signOut()
    navigate('/login')
  }

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 border-b border-black/20 panel-quiet">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-[var(--accent)]/12 flex items-center justify-center text-[var(--accent)] font-semibold">BA</div>
        <nav className="flex gap-6 text-sm">
          <Link to="/" className="text-gray-200 hover:accent">Overview</Link>
          <Link to="/simulation" className="text-gray-400 hover:accent">Simulation</Link>
          <Link to="/training" className="text-gray-400 hover:accent">Training</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-xs muted">{user?.email}</div>
        <button onClick={handleSignOut} className="btn-ghost">Sign out</button>
      </div>
    </header>
  )
}
