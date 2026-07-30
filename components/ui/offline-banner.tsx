"use client"

/**
 * OfflineBanner
 * ─────────────────────────────────────────────────────────────────────────
 * Renders nothing at all while online — zero visual footprint in the
 * normal case. While offline, shows a persistent, unmissable banner so
 * nobody mistakes cached (possibly stale) data for live data. When
 * connectivity returns after being offline, fires a toast confirming
 * anything saved while offline is now syncing — the offline persistence
 * added earlier queues writes automatically, but without this, nobody
 * would actually know that queue just cleared.
 *
 * `print:hidden` — this has no place on a printed page; it's a live
 * connectivity indicator, not part of the content.
 */

import * as React from "react"
import { toast } from "sonner"
import { WifiOff } from "lucide-react"

import { useOnlineStatus } from "@/hooks/useOnlineStatus"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const wasOffline = React.useRef(false)

  React.useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }
    if (wasOffline.current) {
      toast.success("Back online — anything saved while offline is syncing now")
      wasOffline.current = false
    }
  }, [isOnline])

  if (isOnline) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 print:hidden"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        You&apos;re offline — showing the last synced data. Changes you make now will save
        once you&apos;re back online.
      </span>
    </div>
  )
}
