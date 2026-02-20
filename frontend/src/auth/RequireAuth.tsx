import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../firebase'

export default function RequireAuth({ children }: { children: JSX.Element }){
  const user = getCurrentUser()
  const location = useLocation()
  
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }
  
  return children
}
