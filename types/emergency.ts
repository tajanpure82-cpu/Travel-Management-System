/**
 * Emergency contact types.
 * ─────────────────────────────────────────────────────────────────────────
 * Moved out of EmergencyTable.tsx so the service layer can use this type
 * independently — same reasoning as the other migrated modules' types.
 */

export type EmergencyCategory =
  | "Team"
  | "Medical"
  | "Police"
  | "Insurance"
  | "Embassy"
  | "Vehicle Service"
  | "Other"

export interface EmergencyContact {
  id: string
  name: string
  category: EmergencyCategory
  phone: string
  /** Which city/context this contact applies to — free text, optional. */
  city: string
  notes: string
}

/** Shape used when creating a new contact — no `id` yet, Firestore
 *  assigns it on create. */
export type NewEmergencyContact = Omit<EmergencyContact, "id">
