/**
 * Traveller types.
 * ─────────────────────────────────────────────────────────────────────────
 * `assignedVehicle` (a fixed "Unassigned" | "Car A" | "Car B" enum)
 * replaced with `assignedVehicleId` + `assignedVehicleName` — same
 * pattern as Expense's paidById, Fuel's vehicleId, Toll's vehicleId. The
 * old field couldn't reflect reality if a vehicle was renamed or a third
 * one was added; this one always points at a real Vehicle document.
 *
 * `seatNumber` is unchanged — which seat someone has is independent of
 * which vehicle they're in, and there's no reason that needs to be a
 * real reference to anything.
 */

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "Unknown"

export type SeatNumber = 1 | 2 | 3 | 4 | 5

export type DocumentStatus = "Valid" | "Expired" | "Not Provided"

export interface Traveller {
  id: string
  name: string
  nickname: string
  phone: string
  emergencyContact: string
  bloodGroup: BloodGroup
  isDriver: boolean
  /** Firestore document ID of the assigned Vehicle, or null if unassigned. */
  assignedVehicleId: string | null
  /** Denormalized display name, or null if unassigned. */
  assignedVehicleName: string | null
  seatNumber: SeatNumber | null
  passportStatus: DocumentStatus
  voterIdStatus: DocumentStatus
  medicalNotes: string
}

/** Shape used when creating a new traveller — no `id` yet, Firestore
 *  assigns it on create. */
export type NewTraveller = Omit<Traveller, "id">
