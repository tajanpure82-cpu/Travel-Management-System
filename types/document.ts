/**
 * Document record types.
 * ─────────────────────────────────────────────────────────────────────────
 * Moved out of DocumentTable.tsx so the service layer can use this type
 * independently — same reasoning as the other migrated modules' types.
 *
 * `fileReference` stays free text (e.g. "Scanned copy in shared Drive
 * folder"), not a real Firebase Storage upload — see the note in
 * DocumentTable.tsx for why that's a deliberate choice for this pass.
 */

export type DocumentCategory =
  | "Vehicle RC"
  | "Vehicle Insurance"
  | "PUC"
  | "Travel Insurance"
  | "Passport"
  | "Voter ID"
  | "Driving Licence"
  | "Bhansar Permit"
  | "Other"

export type DocumentStatus = "Valid" | "Expiring Soon" | "Expired" | "Missing"

export interface DocumentRecord {
  id: string
  name: string
  category: DocumentCategory
  /** Free text — whose document this is, or which vehicle it belongs to. */
  ownerOrVehicle: string
  /** ISO date string, or null if not applicable / not yet known. */
  expiryDate: string | null
  status: DocumentStatus
  /** Where the physical/scanned copy actually is — free text. */
  fileReference: string
  notes: string
}

/** Shape used when creating a new document record — no `id` yet,
 *  Firestore assigns it on create. */
export type NewDocumentRecord = Omit<DocumentRecord, "id">
