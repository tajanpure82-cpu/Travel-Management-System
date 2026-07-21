"use client"

/**
 * AppSidebar
 * ─────────────────────────────────────────────────────────────────────────
 * Primary navigation for Operation Himalaya.
 *
 * Behaviour
 *  - Desktop (≥ md):  a fixed-position rail on the left edge of the viewport.
 *                     Can be toggled between a full (labelled) and a
 *                     collapsed (icon-only, tooltip-labelled) width. The
 *                     collapsed preference is persisted to localStorage.
 *  - Mobile (< md):   the rail is hidden; a floating trigger button opens
 *                     the same navigation inside a slide-over Sheet. The
 *                     sheet closes automatically on route change.
 *
 * Usage
 *  Render as the first child of a flex row in your root layout. The
 *  component reserves its own horizontal space on desktop via an internal
 *  spacer element that tracks the collapsed state, so no extra layout code
 *  is required in the consuming layout:
 *
 *    export default function RootLayout({ children }: { children: React.ReactNode }) {
 *      return (
 *        <div className="flex min-h-screen">
 *          <AppSidebar />
 *          <main className="flex-1 min-w-0">{children}</main>
 *        </div>
 *      )
 *    }
 *
 * shadcn/ui Base UI compatibility (fixed)
 *  The project's current `components/ui/*` files are generated against
 *  Base UI, not Radix, which changes a couple of APIs this file relies on:
 *    - Neither `TooltipTrigger` nor `SheetTrigger` has an `asChild` prop.
 *      The Base UI equivalent is a `render` prop that takes the element to
 *      render *as* the trigger (here, our `<Link>` and the mobile menu
 *      `<Button>`), while the trigger's own children become that rendered
 *      element's children — see both usages below for the pattern.
 *    - `TooltipProvider` has no `delayDuration` prop; the equivalent is
 *      `delay` (milliseconds). `TooltipTrigger` also accepts its own
 *      `delay` override, which is set explicitly below as well so the
 *      short 200ms hover delay holds regardless of how the generated
 *      wrapper nests its internal provider.
 *
 * Notes
 *  - Route hrefs below assume top-level route segments (e.g. `/fuel`,
 *    `/hotels`). Adjust NAV_ITEMS if your app routes are nested differently.
 *  - Requires the following shadcn/ui primitives to already be generated:
 *    button, sheet, tooltip, scroll-area, separator.
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Map,
  Users,
  Car,
  Wallet,
  Fuel,
  Route as RouteIcon,
  BedDouble,
  ClipboardList,
  FolderOpen,
  Siren,
  Settings,
  Mountain,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface NavItem {
  /** Label shown in the expanded sidebar and as the tooltip when collapsed. */
  title: string
  /** Route this item links to. */
  href: string
  /** Lucide icon component rendered for this item. */
  icon: LucideIcon
  /**
   * Visual emphasis. "destructive" is reserved for safety-critical items
   * (e.g. Emergency) so they read as visually distinct from the rest of
   * the navigation at a glance.
   */
  variant?: "default" | "destructive"
}

/* -------------------------------------------------------------------------- */
/*                              Navigation config                            */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Trip Timeline", href: "/timeline", icon: Map },
  { title: "Travellers", href: "/travellers", icon: Users },
  { title: "Vehicles", href: "/vehicles", icon: Car },
  { title: "Expenses", href: "/expenses", icon: Wallet },
  { title: "Fuel", href: "/fuel", icon: Fuel },
  { title: "Tolls", href: "/tolls", icon: RouteIcon },
  { title: "Hotels", href: "/hotels", icon: BedDouble },
  { title: "Checklist", href: "/checklist", icon: ClipboardList },
  { title: "Documents", href: "/documents", icon: FolderOpen },
  { title: "Emergency", href: "/emergency", icon: Siren, variant: "destructive" },
  { title: "Settings", href: "/settings", icon: Settings },
]

/** localStorage key used to remember the desktop collapsed/expanded state. */
const SIDEBAR_STORAGE_KEY = "operation-himalaya:sidebar-collapsed"

/** Shared hover delay (ms) for the collapsed rail's icon tooltips. */
const TOOLTIP_DELAY = 200

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether a nav item should be highlighted as active.
 * The root route ("/") only matches exactly, everything else also
 * matches its own sub-routes (e.g. "/travellers/123").
 */
function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/* -------------------------------------------------------------------------- */
/*                             Shared nav content                            */
/* -------------------------------------------------------------------------- */

interface SidebarContentProps {
  pathname: string
  /** Icon-only rail (desktop) vs. fully labelled (mobile sheet / expanded desktop). */
  collapsed: boolean
}

/**
 * The brand mark, scrollable nav list, and footer shared by both the
 * desktop rail and the mobile sheet, so the two surfaces never drift
 * out of sync.
 */
function SidebarContent({ pathname, collapsed }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Mountain className="h-5 w-5" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">
              Operation Himalaya
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Trip Control Center
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href)
            const destructive = item.variant === "destructive"

            const linkClassName = cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              collapsed && "justify-center px-0",
              active
                ? destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
                : destructive
                ? "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )

            // Visual content is identical whether or not the item is
            // wrapped in a tooltip — only the trigger wrapper differs.
            const linkContent = (
              <>
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.title}</span>}
                {!collapsed && active && (
                  <span
                    className={cn(
                      "ml-auto h-1.5 w-1.5 shrink-0 rounded-full",
                      destructive ? "bg-destructive" : "bg-primary"
                    )}
                    aria-hidden="true"
                  />
                )}
              </>
            )

            if (collapsed) {
              // Icon-only rail: the anchor is supplied to the tooltip
              // trigger via the `render` prop (Base UI's polymorphic-
              // element API) instead of Radix's `asChild`. The trigger's
              // own children become the rendered anchor's children.
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    delay={TOOLTIP_DELAY}
                    render={
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        aria-label={item.title}
                        className={linkClassName}
                      />
                    }
                  >
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={linkClassName}
              >
                {linkContent}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div
        className={cn(
          "shrink-0 px-4 py-3 text-xs text-muted-foreground",
          collapsed && "px-2 text-center"
        )}
      >
        {collapsed ? "v1.1" : "v1.1 · 1–11 Aug 2026"}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                AppSidebar                                  */
/* -------------------------------------------------------------------------- */

export function AppSidebar() {
  const pathname = usePathname()

  // Desktop icon-rail collapse state, persisted across sessions.
  const [collapsed, setCollapsed] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)

  // Mobile off-canvas sheet open state.
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Read the stored preference once on mount (client-only).
  React.useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) setCollapsed(stored === "true")
    setHydrated(true)
  }, [])

  // Persist changes after the initial read, so we never overwrite the
  // stored value with the default before it has been loaded.
  React.useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
  }, [collapsed, hydrated])

  // Close the mobile drawer automatically whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const desktopWidth = collapsed ? "w-[72px]" : "w-64"

  return (
    <TooltipProvider delay={TOOLTIP_DELAY}>
      {/* ---------------------------------------------------------------- */}
      {/* Mobile: floating trigger + slide-over sheet                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                size="icon"
                variant="outline"
                className="bg-background shadow-sm"
              />
            }
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {/* Visually hidden title for screen readers (Radix Dialog requirement) */}
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation menu</SheetTitle>
            </SheetHeader>
            <SidebarContent pathname={pathname} collapsed={false} />
          </SheetContent>
        </Sheet>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Desktop: fixed rail                                                */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-background transition-all duration-200 ease-in-out md:flex",
          desktopWidth
        )}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} />

        {/* Collapse / expand toggle */}
        <div className="shrink-0 border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              "w-full gap-2",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
            <span className="sr-only">Toggle sidebar width</span>
          </Button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Layout spacer: reserves horizontal space for the fixed rail on    */}
      {/* desktop so sibling content is pushed over correctly. Tracks the   */}
      {/* same width/collapse state as the rail itself.                    */}
      {/* ---------------------------------------------------------------- */}
      <div
        aria-hidden="true"
        className={cn(
          "hidden shrink-0 transition-all duration-200 ease-in-out md:block",
          desktopWidth
        )}
      />
    </TooltipProvider>
  )
}
