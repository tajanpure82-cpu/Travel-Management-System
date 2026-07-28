/**
 * Expense types.
 * ─────────────────────────────────────────────────────────────────────────
 * `split: "Kitty" | "Personal"` retired in favor of `splitType` +
 * `splitAmongIds`/`splitAmongNames` — the old binary couldn't express
 * "shared among these 4 specific people, not all 10" (e.g. only the
 * travellers who smoke, drink, or eat non-veg). "Shared" now always
 * carries an explicit participant list.
 *
 * That list is a *snapshot* taken when the expense is logged — it does
 * not retroactively change if travellers are added or removed later.
 * That's deliberate: a historical expense's settlement math should never
 * shift because the traveller roster changed afterward.
 *
 * `paidById`/`paidByName` unchanged from the earlier relationship work —
 * someone still pays even for a Personal expense, it just doesn't factor
 * into group settlement.
 */

export type ExpenseCategory =
  | "Fuel"
  | "Toll"
  | "Hotel"
  | "Food"
  | "Activity"
  | "Documents & Permits"
  | "Insurance"
  | "Shopping"
  | "Emergency"
  | "Misc"

export type ExpenseCurrency = "INR" | "NPR"

export type ExpenseSplitType = "Shared" | "Personal"

export interface Expense {
  id: string
  /** ISO date string, e.g. "2026-08-01". */
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  currency: ExpenseCurrency
  /** Firestore document ID of the Traveller who paid. */
  paidById: string
  /** Denormalized display name — see file header for why. */
  paidByName: string
  splitType: ExpenseSplitType
  /** Travellers this expense is divided among. Only meaningful when
   *  splitType is "Shared" — empty for "Personal" expenses. */
  splitAmongIds: string[]
  /** Denormalized, parallel to splitAmongIds. */
  splitAmongNames: string[]
  /** Firebase Storage download URL for a receipt photo/PDF, or null if
   *  none was attached. */
  receiptUrl: string | null
}

/** Shape used when creating a new expense — no `id` yet, Firestore
 *  assigns it on create. */
export type NewExpense = Omit<Expense, "id">
