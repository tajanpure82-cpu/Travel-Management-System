/**
 * Trip settings types.
 * ─────────────────────────────────────────────────────────────────────────
 * Unlike every other migrated module's type, TripSettings has no `id`
 * field — Settings is a singleton (one fixed document at settings/trip),
 * not a list of entities with their own Firestore-assigned IDs.
 *
 * `totalBudgetCollected` added for the Dashboard's "Remaining Budget"
 * card — nothing in the schema held a total-budget figure before this,
 * and that card can't be computed honestly without one.
 */

export type SettingsCurrency = "INR" | "NPR"

export interface TripSettings {
  tripName: string
  /** ISO date string, or empty if not set. */
  startDate: string
  /** ISO date string, or empty if not set. */
  endDate: string
  currency: SettingsCurrency
  emergencyFundAmount: number | null
  /** Total kitty budget collected up front, in INR. Used to compute the
   *  Dashboard's Remaining Budget card (this minus kitty spend so far). */
  totalBudgetCollected: number | null
  notes: string
}
