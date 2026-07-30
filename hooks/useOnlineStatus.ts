"use client"

/**
 * useOnlineStatus
 * ─────────────────────────────────────────────────────────────────────────
 * Tracks browser connectivity via the native `navigator.onLine` property
 * plus the `online`/`offline` window events — no new dependency, this is
 * built into every browser.
 *
 * Honest limitation: this only detects "does this device have *some*
 * network connection," not "can it actually reach Firestore." Being
 * connected to a WiFi network with no real internet behind it (common at
 * some hotels/rest stops) would still report `true` here. It's a
 * genuinely useful signal for the common case (no signal at all, which
 * is what this trip will actually hit), just not a perfect one.
 */

import * as React from "react"

export function useOnlineStatus(): boolean {
  // Defaults to true — `navigator` doesn't exist during server-side
  // rendering, so this can't read the real value until the effect below
  // runs client-side. Starting optimistic avoids a flash of the offline
  // banner on every single page load.
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    setIsOnline(navigator.onLine)

    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
