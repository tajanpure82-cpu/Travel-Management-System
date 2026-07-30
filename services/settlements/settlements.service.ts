/**
 * settlements.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "settlementPayments" collection goes
 * through this file. No update or delete — a recorded payment is a fact
 * about something that happened; if one's logged wrong, add a
 * correcting record rather than editing history. (Delete is provided
 * only for the rare "I misclicked, that payment never happened" case.)
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  type WithId,
} from "@/lib/firebase/crud"
import type { NewSettlementPayment, SettlementPayment } from "@/types/settlementPayment"

const COLLECTION = "settlementPayments"

export function subscribeToSettlementPayments(
  onData: (payments: WithId<SettlementPayment>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<SettlementPayment>(COLLECTION, onData, onError, "settledAt")
}

export function recordSettlementPayment(data: NewSettlementPayment): Promise<string> {
  return createDocument<NewSettlementPayment>(COLLECTION, data)
}

export function deleteSettlementPayment(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
