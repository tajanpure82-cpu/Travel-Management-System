/**
 * Firebase client SDK initialization.
 * ─────────────────────────────────────────────────────────────────────────
 * A single shared Firebase App instance, guarded against re-initialization.
 * Next.js hot-reloads modules in development and this file can be imported
 * from many places (services, AuthContext, etc.) — without the
 * `getApps().length` guard, each import would try to call `initializeApp`
 * again and throw "Firebase App named '[DEFAULT]' already exists."
 *
 * This file is safe to import from Client Components only ("use client"
 * files, or files imported exclusively by them). Firebase's JS SDK expects
 * a browser environment for Auth persistence and real-time listeners.
 */

import { getApps, initializeApp, type FirebaseOptions } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Fail loudly and early in development if env vars are missing, rather than
// letting Firebase throw a much less obvious error later.
if (process.env.NODE_ENV !== "production") {
  const missing = Object.entries(firebaseConfig).filter(([, value]) => !value)
  if (missing.length > 0) {
    console.warn(
      `[firebase/config] Missing env vars: ${missing.map(([key]) => key).join(", ")}. ` +
        "Check .env.local against .env.local.example."
    )
  }
}

export const firebaseApp = getApps().length
  ? getApps()[0]!
  : initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)
