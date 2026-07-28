/**
 * Timeline entry types.
 * ─────────────────────────────────────────────────────────────────────────
 * Moved out of TimelineTable.tsx so the service layer can use this type
 * independently — same reasoning as the other migrated modules' types.
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
}

/** Shape used when creating a new entry — no `id` yet, Firestore assigns
 *  it on create. */
export type NewTimelineEntry = Omit<TimelineEntry, "id">
