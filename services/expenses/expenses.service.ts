/**
 * expenses.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "expenses" collection goes through this
 * file. Ordered by date (ISO strings sort correctly lexicographically, no
 * Timestamp conversion needed).
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { Expense, NewExpense } from "@/types/expense"

const COLLECTION = "expenses"

export function subscribeToExpenses(
  onData: (expenses: WithId<Expense>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<Expense>(COLLECTION, onData, onError, "date")
}

export function addExpense(data: NewExpense): Promise<string> {
  return createDocument<NewExpense>(COLLECTION, data)
}

export function updateExpense(id: string, data: Partial<NewExpense>): Promise<void> {
  return updateDocument<NewExpense>(COLLECTION, id, data)
}

export function deleteExpense(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
