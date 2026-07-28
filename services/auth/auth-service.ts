/**
 * auth-service
 * ─────────────────────────────────────────────────────────────────────────
 * Thin wrappers around the Firebase Auth SDK calls this app needs. Kept
 * separate from contexts/AuthContext.tsx so the *raw* Firebase calls
 * (testable, swappable) are distinct from the *React state wiring* (the
 * Context/hook that exposes `user` and `loading` to components).
 */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth"

import { auth } from "@/lib/firebase/config"

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}
