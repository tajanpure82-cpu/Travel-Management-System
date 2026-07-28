"use client"

/**
 * useLiveCollection
 * ─────────────────────────────────────────────────────────────────────────
 * Subscribes to a live Firestore collection via one of the
 * services/<module>/<module>.service.ts subscribe functions, tracking
 * loading and error state alongside the data.
 *
 * This is the first (and, deliberately, only) generic hook in this app.
 * Every individual module still subscribes inline in its own XTable.tsx —
 * that was the right call when each one only ever needed its own single
 * collection, and it stays unchanged here. Dashboard is different: it's
 * the first component that needs to read many collections at once, which
 * is exactly the case a shared hook earns its keep — without it, the same
 * subscribe/loading boilerplate would be copy-pasted 11 times in
 * SummaryCards.tsx.
 *
 * No toast on error here, deliberately — see the note in SummaryCards.tsx
 * for why Dashboard degrades quietly instead of surfacing toasts for a
 * passive summary view.
 */

import * as React from "react"
import type { FirestoreError } from "firebase/firestore"

import type { WithId } from "@/lib/firebase/crud"

interface UseLiveCollectionResult<T> {
  data: WithId<T>[]
  loading: boolean
  error: boolean
}

export function useLiveCollection<T>(
  subscribeFn: (
    onData: (items: WithId<T>[]) => void,
    onError?: (error: FirestoreError) => void
  ) => () => void
): UseLiveCollectionResult<T> {
  const [data, setData] = React.useState<WithId<T>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = subscribeFn(
      (items) => {
        setData(items)
        setLoading(false)
        setError(false)
      },
      () => {
        setLoading(false)
        setError(true)
      }
    )
    return unsubscribe
    // subscribeFn is one of the stable, module-level service functions
    // (e.g. subscribeToTravellers) — it never changes identity between
    // renders, so it's intentionally left out of the dependency array
    // rather than requiring callers to useCallback-wrap a service import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error }
}
