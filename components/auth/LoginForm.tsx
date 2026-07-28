"use client"

/**
 * LoginForm
 * ─────────────────────────────────────────────────────────────────────────
 * The only new UI surface auth requires — there was no sign-in screen
 * before because there was no auth before. Built entirely from primitives
 * already used everywhere else in this app (Card, Input, Label, Button),
 * matching the existing visual language rather than introducing a new one.
 *
 * Toggles between Sign In and Create Account for the email/password path;
 * Google is a single button either way.
 */

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/AuthContext"
import { getErrorMessage } from "@/lib/firebase/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mountain, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Mode = "sign-in" | "sign-up"

/** Google's official multi-color "G" mark — not available in Lucide (a
 *  generic icon set), so it's drawn inline per Google's brand guidelines
 *  for "Sign in with Google" buttons. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.58-5.17 3.58-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31A7.2 7.2 0 0 1 4.93 12c0-.8.14-1.58.38-2.31V6.6H1.3A12 12 0 0 0 0 12c0 1.94.46 3.77 1.3 5.4l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.3 6.6l4.01 3.09C6.25 6.87 8.89 4.77 12 4.77Z"
      />
    </svg>
  )
}

export function LoginForm() {
  const router = useRouter()
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const [mode, setMode] = React.useState<Mode>("sign-in")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false)

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true)
    try {
      await signInWithGoogle()
      toast.success("Signed in")
      router.push("/")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (mode === "sign-in") {
        await signInWithEmail(email, password)
        toast.success("Signed in")
      } else {
        await signUpWithEmail(email, password)
        toast.success("Account created")
      }
      router.push("/")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting || isGoogleSubmitting

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold">Operation Himalaya</span>
        </div>
        <CardTitle>{mode === "sign-in" ? "Sign in" : "Create an account"}</CardTitle>
        <CardDescription>
          {mode === "sign-in"
            ? "Sign in to access the trip dashboard."
            : "Create an account to access the trip dashboard."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleSignIn}
          disabled={busy}
        >
          {isGoogleSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={busy}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {mode === "sign-in" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"))}
          disabled={busy}
        >
          {mode === "sign-in"
            ? "Don't have an account? Create one"
            : "Already have an account? Sign in"}
        </Button>
      </CardFooter>
    </Card>
  )
}
