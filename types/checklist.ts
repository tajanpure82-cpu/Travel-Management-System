/**
 * Checklist item types.
 * ─────────────────────────────────────────────────────────────────────────
 * Moved out of ChecklistTable.tsx so the service layer can use this type
 * independently — same reasoning as the other migrated modules' types.
 */

export type ChecklistCategory =
  | "Pre-Trip"
  | "Documents"
  | "Vehicle"
  | "Packing"
  | "Daily"
  | "Other"

export type ChecklistPriority = "Low" | "Medium" | "High"

export interface ChecklistItem {
  id: string
  title: string
  category: ChecklistCategory
  priority: ChecklistPriority
  completed: boolean
  notes: string
}

/** Shape used when creating a new checklist item — no `id` yet, Firestore
 *  assigns it on create. */
export type NewChecklistItem = Omit<ChecklistItem, "id">
