/**
 * Settlement payment types.
 * ─────────────────────────────────────────────────────────────────────────
 * Tracks *actual* recorded payments between travellers — distinct from
 * the live-computed "suggested" settlements in lib/settlement.ts.
 *
 * Without this, the Settlement section would only ever show what
 * *should* happen, with no memory of what actually did. Someone pays
 * their ₹25, the app has no record of it, and either it keeps suggesting
 * the same payment forever or a new expense shifts the numbers and
 * nobody can tell what's already been settled from what hasn't.
 *
 * Each record is one payment from one person to another, in one
 * currency, at one point in time — it's fine for someone to make several
 * smaller recorded payments toward what they owe rather than one lump
 * sum.
 */

import type { ExpenseCurrency } from "@/types/expense"

export interface SettlementPayment {
  id: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
  currency: ExpenseCurrency
  /** ISO date string, e.g. "2026-08-11". */
  settledAt: string
  notes: string
}

/** Shape used when recording a new payment — no `id` yet, Firestore
 *  assigns it on create. */
export type NewSettlementPayment = Omit<SettlementPayment, "id">
