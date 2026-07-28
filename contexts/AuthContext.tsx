"use client"

/**
 * AuthContext
 * ─────────────────────────────────────────────────────────────────────────
 * The one piece of genuinely global state in this app: who's signed in.
 * Every page needs this, which is exactly the case Context exists for —
 * unlike the 11 feature modules' own lists, this isn't "shared data that
 * could be prop-drilled," it's inherently app-wide session state.
 *
 * Mounted once in the root layout (see app/layout.tsx), same spot every
 * other cross-cutting provider in this app would go.
 */

import * as React from "react"
import { onAuthStateChanged, type User } from "firebase/auth"

import { auth } from "@/lib/firebase/config"
import {
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from "@/services/auth/auth-service"

interface AuthContextValue {
  user: User | null
  /** True until the initial auth-state check completes. */
  loading: boolean
  signInWithGoogle: () => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUpWithEmail: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut: signOutUser,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
