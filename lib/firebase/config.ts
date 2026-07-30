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
 *
 * Offline persistence (added): Firestore, unlike Firebase's native mobile
 * SDKs, does NOT cache data locally by default on the web — without this,
 * losing signal meant every page needed a live connection to show
 * anything at all, and any add/edit would just fail outright. Given this
 * trip goes through the Himalayas and Nepal, where signal will genuinely
 * be patchy for real stretches, that's a meaningful gap to close.
 *
 * `persistentLocalCache` turns on IndexedDB-backed local storage of
 * whatever's already been read, so a page that was viewed with signal
 * keeps showing that data with none. `persistentMultipleTabManager` is
 * included so this still works correctly if someone has the app open in
 * more than one browser tab at once — without it, only the first tab
 * opened would get persistence, and others would silently fall back to
 * memory-only caching.
 *
 * This does NOT make writes work with zero connection forever — an
 * add/edit made offline is queued locally and sent automatically the
 * moment connectivity returns, which is exactly the useful case (jot
 * something down in a signal gap, it saves for real once back in range)
 * rather than a promise of indefinite offline editing.
 */

import { getApps, initializeApp, type FirebaseOptions } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore"
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

// Guarded the same way as `firebaseApp` above, for the same reason:
// Next.js's dev-mode Fast Refresh can re-run this module against an
// *already-initialized* app. `initializeFirestore` throws if called
// twice for one app — even with identical settings — so this falls
// back to `getFirestore()` (which just returns the existing instance)
// rather than crashing on every hot-reload during local development.
function initializeDb(): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    return getFirestore(firebaseApp)
  }
}

export const db = initializeDb()

export const storage = getStorage(firebaseApp)
