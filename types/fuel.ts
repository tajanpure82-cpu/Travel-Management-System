/**
 * Fuel entry types.
 * ─────────────────────────────────────────────────────────────────────────
 * `vehicle` (free text) replaced with `vehicleId` + `vehicleName` — same
 * pattern as Expense's paidById/paidByName. `vehicleId` is the real
 * Firestore document ID of a Vehicle, which is what makes "total fuel
 * cost per vehicle" reliable (no typos, no "Car A" vs "car a").
 *
 * `vehicleName` is denormalized alongside it for the same reason as
 * Expense's paidByName: avoids a live join on every list render, at the
 * accepted cost that a renamed vehicle won't retroactively update past
 * fuel entries' displayed name.
 */

export type FuelCurrency = "INR" | "NPR"

export interface FuelEntry {
  id: string
  /** ISO date string, e.g. "2026-08-01". */
  date: string
  /** Firestore document ID of the Vehicle this fill-up was for. */
  vehicleId: string
  /** Denormalized display name — see file header for why. */
  vehicleName: string
  location: string
  odometer: number | null
  litres: number
  amount: number
  currency: FuelCurrency
  fullTank: boolean
  notes: string
}

/** Shape used when creating a new fuel entry — no `id` yet, Firestore
 *  assigns it on create. */
export type NewFuelEntry = Omit<FuelEntry, "id">
