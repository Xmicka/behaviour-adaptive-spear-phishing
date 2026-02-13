/*
  Demo-safe Firebase shim.
  - Intended for demo-only: this file exposes a minimal API that mirrors
    Firebase email/password auth semantics used by the app.
  - For production: replace the `USE_REAL_FIREBASE` flag and provide
    a real Firebase config. Use Firebase Admin + secure backend for real systems.

  Hardcoded demo users (for local demo):
    - admin@example.com / password: DemoPass123
    - owner@example.com / password: DemoPass123

  These are intentionally simple and only for internal demo usage.
*/

type User = {
  email: string
  uid: string
}

const DEMO_USERS: Record<string, { password: string; uid: string }> = {
  'admin@example.com': { password: 'DemoPass123', uid: 'uid-admin-1' },
  'owner@example.com': { password: 'DemoPass123', uid: 'uid-owner-2' }
}

const STORAGE_KEY = 'demo_auth_user'

export async function signInWithEmailAndPassword(email: string, password: string): Promise<User> {
  // Demo fallback: validate against hardcoded users
  const entry = DEMO_USERS[email]
  if (entry && entry.password === password) {
    const user = { email, uid: entry.uid }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }
  // If real Firebase integration is desired, this is where you'd call
  // firebase/auth's signInWithEmailAndPassword and return the user object.
  throw new Error('Invalid demo credentials')
}

export function signOut(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY)
  return Promise.resolve()
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function onAuthStateChanged(cb: (user: User | null) => void) {
  // Minimal implementation: call immediately and on storage events
  cb(getCurrentUser())
  const handler = () => cb(getCurrentUser())
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
