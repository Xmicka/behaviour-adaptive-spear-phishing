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
