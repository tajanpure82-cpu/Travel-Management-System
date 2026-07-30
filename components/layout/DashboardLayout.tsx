"use client"

/**
 * DashboardLayout
 * ─────────────────────────────────────────────────────────────────────────
 * Shell used by every dashboard route: an offline banner (visible only
 * when offline), a responsive sidebar on the left, a sticky header, and
 * a main content region that fills the remaining space.
 *
 * OfflineBanner is added here, once, rather than per-page — same
 * approach as the sidebar/header print-hiding done earlier. It renders
 * nothing at all while online, so this has zero effect on the normal
 * case; the outer container changed from a row layout to a column
 * layout specifically to let the banner span full width above the
 * sidebar+content row, which is otherwise unchanged.
 *
 * Auth gating unchanged from before: every dashboard route requires a
 * signed-in user, shows a spinner while auth state resolves, and
 * redirects to /login if there's no user.
 */

import * as React from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"

import { AppSidebar } from "@/components/layout/AppSidebar"
import DashboardHeader from "@/components/layout/DashboardHeader"
import { Button } from "@/components/ui/button"
import { OfflineBanner } from "@/components/ui/offline-banner"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardLayoutProps {
  /** Page title, forwarded to DashboardHeader. */
  title: string
  /** Supporting text shown under the title, forwarded to DashboardHeader. */
  subtitle: string
  /** Page content rendered inside the main content area. */
  children: ReactNode
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  // Covers both "still checking auth state" and "confirmed signed out, about
  // to redirect" — avoids ever flashing real dashboard content to someone
  // who isn't signed in.
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Offline banner: renders nothing while online, so this adds no
          height/spacing in the normal case. Sticky so it stays visible
          even if the page content underneath scrolls. */}
      <div className="sticky top-0 z-50">
        <OfflineBanner />
      </div>

      {/* Sidebar + content row — unchanged from before, just nested one
          level deeper so the banner above can span full width. */}
      <div className="flex flex-1">
        {/* Sidebar: fixed rail on desktop, off-canvas sheet on mobile.
            Hidden entirely when printing. */}
        <div className="print:hidden">
          <AppSidebar />
        </div>

        {/* Content column: header + main, fills the space beside the sidebar. */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/*
            Sticky header. Left padding on mobile keeps its content clear of
            AppSidebar's floating menu trigger (fixed top-4 left-4); the
            padding drops away once the desktop rail takes over at `md`.
          */}
          <div className="sticky top-0 z-30 bg-background pl-14 md:pl-0 print:static print:pl-0">
            <div className="flex items-start justify-between gap-4 p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
              <DashboardHeader title={title} subtitle={subtitle} />
              <div className="flex shrink-0 items-center gap-3 pt-1 print:hidden">
                <span className="hidden max-w-[16ch] truncate text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main content: fills the remaining space, scrolls with the page. */}
          <main className="flex flex-1 flex-col">
            <div className="mx-auto w-full max-w-screen-2xl flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
