import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../firebase'

// Protect routes for admin-only users (demo). In a real deployment, this
// should validate user roles and consult the backend for authorization.
export default function RequireAuth({ children }: { children: JSX.Element }){
  const user = getCurrentUser()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
