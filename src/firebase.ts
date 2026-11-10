import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { getAuth, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfig = [config.apiKey, config.authDomain, config.databaseURL, config.projectId, config.appId]
export const isFirebaseConfigured = requiredConfig.every((value) => Boolean(value?.trim()))

const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(config)
  : null

export const auth: Auth | null = app ? getAuth(app) : null
export const database: Database | null = app ? getDatabase(app) : null
export const analytics: Promise<Analytics | null> = app && config.measurementId
  ? isSupported().then((supported) => supported ? getAnalytics(app) : null).catch(() => null)
  : Promise.resolve(null)