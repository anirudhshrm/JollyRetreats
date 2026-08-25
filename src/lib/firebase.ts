import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth
} from 'firebase/auth'

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const firebaseAuthEnabled = import.meta.env.VITE_FIREBASE_AUTH_ENABLED === 'true'

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
)

const canUseFirebaseAuth = firebaseAuthEnabled && hasFirebaseConfig

let authInstance: Auth | null = null

const getFirebaseAuth = () => {
  if (!canUseFirebaseAuth) {
    return null
  }

  if (!authInstance) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    authInstance = getAuth(app)
  }

  return authInstance
}

const getFirebaseLoginMessage = (code: string) => {
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid Firebase email or password.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many Firebase login attempts. Please try again later.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Firebase login could not reach the network. Please try again.'
  }

  return 'Firebase login failed. Please try again.'
}

export const isFirebaseLoginEnabled = () => canUseFirebaseAuth

export const loginWithFirebase = async (email: string, password: string) => {
  const auth = getFirebaseAuth()
  if (!auth) {
    return null
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    throw new Error(getFirebaseLoginMessage(code))
  }
}

export const logoutFirebaseUser = async () => {
  const auth = getFirebaseAuth()
  if (!auth) {
    return
  }

  await signOut(auth)
}
