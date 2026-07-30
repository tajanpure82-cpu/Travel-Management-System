import { LoginForm } from "@/components/auth/LoginForm"

/**
 * Login route. Deliberately outside DashboardLayout — it has no sidebar,
 * no header, nothing to protect yet since this is the page that grants
 * access to everything else.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <LoginForm />
    </div>
  )
}
