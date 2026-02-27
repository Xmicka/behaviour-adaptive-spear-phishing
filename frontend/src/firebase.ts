/**
 * Firebase configuration & initialization.
 *
 * - Reads config from `import.meta.env.VITE_FIREBASE_*` env vars.
 * - If env vars are missing, falls back to a demo-only shim so the app
 *   remains functional for local development without a Firebase project.
 *
 * Demo credentials (when in demo mode):
 *   admin@example.com / DemoPass123
 *   owner@example.com / DemoPass123
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword as fbSignIn,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/* ------------------------------------------------------------------ */
/*  Detect whether real Firebase config is available                    */
/* ------------------------------------------------------------------ */
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined

const USE_REAL_FIREBASE = Boolean(apiKey && apiKey.length > 0)

/* ------------------------------------------------------------------ */
/*  Real Firebase path                                                 */
/* ------------------------------------------------------------------ */
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (USE_REAL_FIREBASE) {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  }
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }

/* ------------------------------------------------------------------ */
/*  Unified User type (works for both real & demo)                     */
/* ------------------------------------------------------------------ */
export type AppUser = {
  email: string | null
  uid: string
  displayName?: string | null
}

/* ------------------------------------------------------------------ */
/*  Demo shim (used when env vars are not set)                         */
/* ------------------------------------------------------------------ */
const DEMO_USERS: Record<string, { password: string; uid: string }> = {
  'admin@example.com': { password: 'DemoPass123', uid: 'uid-admin-1' },
  'owner@example.com': { password: 'DemoPass123', uid: 'uid-owner-2' },
}
const STORAGE_KEY = 'demo_auth_user'

function getDemoUser(): AppUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AppUser } catch { return null }
}

/* ------------------------------------------------------------------ */
/*  Exported auth helpers                                              */
/* ------------------------------------------------------------------ */

/** Sign in with email + password. */
export async function signInWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AppUser> {
  if (USE_REAL_FIREBASE && auth) {
    try {
      const cred = await fbSignIn(auth, email, password)
      return { email: cred.user.email, uid: cred.user.uid, displayName: cred.user.displayName }
    } catch (err: any) {
      // Fall back to demo mode on network failures so the app works offline
      const code = err?.code || ''
      if (code === 'auth/network-request-failed' || code === 'auth/internal-error') {
        console.warn('Firebase unreachable — falling back to demo auth')
      } else {
        throw err  // Re-throw real auth errors (wrong password, etc.)
      }
    }
  }
  // Demo fallback
  const entry = DEMO_USERS[email]
  if (entry && entry.password === password) {
    const user: AppUser = { email, uid: entry.uid }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }
  throw new Error('Invalid credentials')
}

/** Create a new account with email + password. */
export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AppUser> {
  if (USE_REAL_FIREBASE && auth) {
    const cred = await fbCreateUser(auth, email, password)
    return { email: cred.user.email, uid: cred.user.uid }
  }
  throw new Error('Sign-up requires Firebase configuration')
}

/** Sign in with Google popup (requires Firebase). */
export async function signInWithGoogle(): Promise<AppUser> {
  if (!USE_REAL_FIREBASE || !auth) {
    throw new Error('Google sign-in requires Firebase configuration')
  }
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return {
    email: result.user.email,
    uid: result.user.uid,
    displayName: result.user.displayName,
  }
}

/** Sign out. */
export async function signOut(): Promise<void> {
  // Always clear demo user
  localStorage.removeItem(STORAGE_KEY)
  if (USE_REAL_FIREBASE && auth) {
    try { await fbSignOut(auth) } catch { /* ignore if Firebase unreachable */ }
  }
}

/** Get current user (synchronous). */
export function getCurrentUser(): AppUser | null {
  if (USE_REAL_FIREBASE && auth) {
    const u = auth.currentUser
    if (u) return { email: u.email, uid: u.uid, displayName: u.displayName }
  }
  // Also check demo storage (covers case where Firebase is configured but unreachable)
  return getDemoUser()
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChanged(cb: (user: AppUser | null) => void): () => void {
  if (USE_REAL_FIREBASE && auth) {
    const unsub = fbOnAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        cb({ email: fbUser.email, uid: fbUser.uid, displayName: fbUser.displayName })
      } else {
        // Firebase says no user — check if theres a demo user in localStorage
        // (happens when Firebase is unreachable and user logged in via demo fallback)
        const demoUser = getDemoUser()
        cb(demoUser)
      }
    })
    // Also listen for demo storage changes (for cross-tab sync in demo mode)
    const handler = () => {
      const demoUser = getDemoUser()
      if (demoUser) cb(demoUser)
    }
    window.addEventListener('storage', handler)
    return () => { unsub(); window.removeEventListener('storage', handler) }
  }
  // Pure demo fallback: poll localStorage
  cb(getDemoUser())
  const handler = () => cb(getDemoUser())
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

/** Whether the app is running against real Firebase. */
export const isFirebaseConfigured = USE_REAL_FIREBASE
