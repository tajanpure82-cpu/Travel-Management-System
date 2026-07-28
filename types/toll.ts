/**
 * Toll entry types.
 * ─────────────────────────────────────────────────────────────────────────
 * Redesigned from the original "carAAmount + carBAmount" shape, which
 * hardcoded exactly two vehicles forever. Now one entry = one vehicle =
 * one amount, same pattern as Fuel (vehicleId/vehicleName) and Expenses
 * (paidById/paidByName). If two vehicles cross the same toll plaza, that's
 * two separate entries — consistent with how Fuel already works when two
 * vehicles fill up at the same station, and it works for any number of
 * vehicles, not just exactly two.
 *
 * Single currency (INR) only — Nepal has no tolls on this route, so no
 * dual-currency split like Expenses/Fuel/Hotels is needed here.
 */

export type TollMethod = "FASTag" | "Cash"

export interface TollEntry {
  id: string
  /** ISO date string, e.g. "2026-08-01". */
  date: string
  /** e.g. "Samruddhi Mahamarg (full)", "Nagpur -> Raipur". */
  section: string
  /** Firestore document ID of the Vehicle this toll was paid for. */
  vehicleId: string
  /** Denormalized display name — see file header for why. */
  vehicleName: string
  amount: number
  method: TollMethod
  notes: string
}

/** Shape used when creating a new toll entry — no `id` yet, Firestore
 *  assigns it on create. */
export type NewTollEntry = Omit<TollEntry, "id">
