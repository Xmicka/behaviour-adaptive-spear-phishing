/**
 * Firestore collection types and helper functions.
 *
 * Collections:
 *  - users          – platform users with roles
 *  - organizations  – customer organizations
 *  - simulations    – phishing simulation campaigns
 *  - employees      – tracked employees per org
 *  - training_events – individual training assignments
 */
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    serverTimestamp,
    type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/* ------------------------------------------------------------------ */
/*  Document types                                                     */
/* ------------------------------------------------------------------ */

export interface UserDoc {
    uid: string
    email: string | null
    displayName?: string | null
    role: 'admin' | 'owner' | 'viewer'
    orgId?: string
    createdAt?: Timestamp
    lastLoginAt?: Timestamp
}

export interface OrganizationDoc {
    id?: string
    name: string
    domain: string
    plan: 'free' | 'pro' | 'enterprise'
    createdAt?: Timestamp
}

export interface SimulationDoc {
    id?: string
    orgId: string
    name: string
    status: 'draft' | 'active' | 'completed' | 'archived'
    createdAt?: Timestamp
    config?: Record<string, unknown>
}

export interface EmployeeDoc {
    id?: string
    orgId: string
    name: string
    email: string
    department?: string
    riskScore?: number
}

export interface TrainingEventDoc {
    id?: string
    employeeId: string
    type: 'micro' | 'long-form'
    status: 'assigned' | 'in-progress' | 'completed'
    assignedAt?: Timestamp
    completedAt?: Timestamp | null
}

/* ------------------------------------------------------------------ */
/*  Helper functions (only usable when Firebase is configured)         */
/* ------------------------------------------------------------------ */

/**
 * Get or create a user document in Firestore.
 */
export async function getOrCreateUser(
    uid: string,
    defaults: Partial<UserDoc>,
): Promise<UserDoc | null> {
    if (!db) return null
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) return snap.data() as UserDoc
    const newDoc: UserDoc = {
        uid,
        email: defaults.email ?? null,
        role: defaults.role ?? 'viewer',
        createdAt: serverTimestamp() as unknown as Timestamp,
        ...defaults,
    }
    await setDoc(ref, newDoc)
    return newDoc
}

/**
 * Fetch all employees for an organization.
 */
export async function fetchOrgEmployees(orgId: string): Promise<EmployeeDoc[]> {
    if (!db) return []
    const q = query(collection(db, 'employees'), where('orgId', '==', orgId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeDoc))
}

/**
 * Fetch simulations for an organization.
 */
export async function fetchOrgSimulations(orgId: string): Promise<SimulationDoc[]> {
    if (!db) return []
    const q = query(collection(db, 'simulations'), where('orgId', '==', orgId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SimulationDoc))
}

/**
 * Fetch training events for an employee.
 */
export async function fetchEmployeeTraining(employeeId: string): Promise<TrainingEventDoc[]> {
    if (!db) return []
    const q = query(collection(db, 'training_events'), where('employeeId', '==', employeeId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingEventDoc))
}
