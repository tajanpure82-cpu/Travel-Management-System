import type { ReactNode } from "react"

// Adjust these two import paths if AppSidebar / DashboardHeader live
// somewhere other than a flat `components/` directory in your project.
import { AppSidebar } from "@/components/layout/AppSidebar"
import DashboardHeader from "@/components/layout/DashboardHeader"

interface DashboardLayoutProps {
  /** Page title, forwarded to DashboardHeader. */
  title: string
  /** Supporting text shown under the title, forwarded to DashboardHeader. */
  subtitle: string
  /** Page content rendered inside the main content area. */
  children: ReactNode
}

/**
 * DashboardLayout
 * ─────────────────────────────────────────────────────────────────────────
 * Shell used by every dashboard route: a responsive sidebar on the left,
 * a sticky header, and a main content region that fills the remaining
 * space.
 *
 * AppSidebar already manages its own responsive behaviour — a fixed rail
 * on desktop and a slide-over sheet on mobile — and reserves its own
 * horizontal space via an internal spacer. That means this layout only
 * has to place it as the first flex child; no extra margin or padding
 * bookkeeping for the sidebar's width is needed here.
 *
 * DashboardHeader requires `title` and `subtitle`, so every route using
 * this layout must supply them — there's no sensible shared default for
 * a shell reused across pages with different titles.
 *
 * Usage
 *   export default function Page({ children }: { children: React.ReactNode }) {
 *     return (
 *       <DashboardLayout title="Vehicles" subtitle="Manage your fleet">
 *         {children}
 *       </DashboardLayout>
 *     )
 *   }
 */
export function DashboardLayout({
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar: fixed rail on desktop, off-canvas sheet on mobile. */}
      <AppSidebar />

      {/* Content column: header + main, fills the space beside the sidebar. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          Sticky header. Left padding on mobile keeps its content clear of
          AppSidebar's floating menu trigger (fixed top-4 left-4); the
          padding drops away once the desktop rail takes over at `md`.
        */}
        <div className="sticky top-0 z-30 bg-background pl-14 md:pl-0">
          <DashboardHeader title={title} subtitle={subtitle} />
        </div>

        {/* Main content: fills the remaining space, scrolls with the page. */}
        <main className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-screen-2xl flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
