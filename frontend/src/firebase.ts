/**
 * Firebase configuration & initialization.
 *
 * - Reads config strictly from `import.meta.env.VITE_FIREBASE_*` env vars.
 * - Fails loudly if any required environment variables are missing.
 * - No fallback demo mode.
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
/*  Required Firebase Environment Variables                           */
/* ------------------------------------------------------------------ */
const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

for (const varName of REQUIRED_VARS) {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required Firebase environment variable: ${varName}`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

/* ------------------------------------------------------------------ */
/*  Firebase Initialization                                           */
/* ------------------------------------------------------------------ */
const app: FirebaseApp = initializeApp(firebaseConfig)
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)

export { app, auth, db }

/* ------------------------------------------------------------------ */
/*  Unified User type                                                 */
/* ------------------------------------------------------------------ */
export type AppUser = {
  email: string | null
  uid: string
  displayName?: string | null
}

/* ------------------------------------------------------------------ */
/*  Exported auth helpers                                             */
/* ------------------------------------------------------------------ */

/** Sign in with email + password. */
export async function signInWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AppUser> {
  const cred = await fbSignIn(auth, email, password)
  return { email: cred.user.email, uid: cred.user.uid, displayName: cred.user.displayName }
}

/** Create a new account with email + password. */
export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AppUser> {
  const cred = await fbCreateUser(auth, email, password)
  return { email: cred.user.email, uid: cred.user.uid }
}

/** Sign in with Google popup (requires Firebase). */
export async function signInWithGoogle(): Promise<AppUser> {
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
  await fbSignOut(auth)
}

/** Get current user (synchronous). */
export function getCurrentUser(): AppUser | null {
  const u = auth.currentUser
  if (u) return { email: u.email, uid: u.uid, displayName: u.displayName }
  return null
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChanged(cb: (user: AppUser | null) => void): () => void {
  const unsub = fbOnAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      cb({ email: fbUser.email, uid: fbUser.uid, displayName: fbUser.displayName })
    } else {
      cb(null)
    }
  })
  return unsub
}

/** Whether the app is running against real Firebase. */
export const isFirebaseConfigured = true

