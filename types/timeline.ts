/**
 * Timeline entry types.
 * ─────────────────────────────────────────────────────────────────────────
 * `latitude`/`longitude` added for the Route Map — optional, since a leg
 * with no location set simply doesn't appear on the map rather than
 * blocking anything. See lib/routeCities.ts for the known-city lookup
 * that fills these in automatically when picking one of the route's
 * planned cities, and components/timeline/RouteMap.tsx for where they're
 * actually plotted.
 */

export type TimelineStatus = "Upcoming" | "In Progress" | "Completed"

export interface TimelineEntry {
  id: string
  /** Day 1-11 (or whatever numbering fits), or null if not tied to a day. */
  day: number | null
  /** ISO date string, or null if not yet known. */
  date: string | null
  title: string
  distanceKm: number | null
  status: TimelineStatus
  notes: string
  /** Null if this leg has no location set — it just won't appear on the map. */
  latitude: number | null
  longitude: number | null
}

/** Shape used when creating a new entry — no `id` yet, Firestore assigns
 *  it on create. */
export type NewTimelineEntry = Omit<TimelineEntry, "id">
