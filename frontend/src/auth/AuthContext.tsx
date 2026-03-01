/**
 * AuthContext – React context for Firebase (or demo) authentication.
 *
 * Provides:
 *  - user: current AppUser | null
 *  - loading: true while auth state is initializing
 *  - login(email, pw): sign in with email/password
 *  - loginWithGoogle(): sign in with Google popup
 *  - logout(): sign out
 *
 * Wraps the unified helpers from firebase.ts so components don't need
 * to import auth functions directly.
 */
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
    type AppUser,
    signInWithEmailAndPassword,
    signInWithGoogle,
    signOut,
    onAuthStateChanged,
    db,
    isFirebaseConfigured,
} from '../firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

/* ------------------------------------------------------------------ */
/*  Context shape                                                      */
/* ------------------------------------------------------------------ */
interface AuthContextValue {
    user: AppUser | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => Promise<void>
    isFirebase: boolean
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    login: async () => { },
    loginWithGoogle: async () => { },
    logout: async () => { },
    isFirebase: false,
})

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null)
    const [loading, setLoading] = useState(true)

    // Listen for auth state changes
    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }

        const unsub = onAuthStateChanged((u) => {
            setUser(u)
            setLoading(false)
        })
        return unsub
    }, [])

    /**
     * After a successful login, ensure the user has a document in
     * the Firestore `users` collection (upsert / merge).
     */
    const ensureUserDoc = async (u: AppUser) => {
        if (!db) return
        try {
            await setDoc(
                doc(db, 'users', u.uid),
                {
                    email: u.email,
                    displayName: u.displayName ?? null,
                    role: 'viewer', // default role; admins can upgrade later
                    lastLoginAt: serverTimestamp(),
                },
                { merge: true },
            )
        } catch (err) {
            console.warn('Could not upsert user doc:', err)
        }
    }

    const login = async (email: string, password: string) => {
        const u = await signInWithEmailAndPassword(email, password)
        setUser(u)
        await ensureUserDoc(u)
    }

    const loginWithGoogle = async () => {
        const u = await signInWithGoogle()
        setUser(u)
        await ensureUserDoc(u)
    }

    const logout = async () => {
        await signOut()
        setUser(null)
    }

    if (!isFirebaseConfigured) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-red-950/20 border border-red-500/50 rounded-xl max-w-lg p-6 space-y-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-red-400">Configuration Error</h1>
                    <p className="text-sm text-slate-300">
                        Firebase environment variables are missing. Please ensure you have set all required
                        <code className="bg-slate-900 px-1 py-0.5 rounded mx-1 text-cyan-400">VITE_FIREBASE_*</code>
                        variables in your deployment environment.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider
            value={{ user, loading, login, loginWithGoogle, logout, isFirebase: true }}
        >
            {children}
        </AuthContext.Provider>
    )
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useAuth(): AuthContextValue {
    return useContext(AuthContext)
}

export default AuthContext
