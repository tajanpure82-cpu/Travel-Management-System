/**
 * tolls.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "tolls" collection goes through this file.
 * Ordered by date.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { NewTollEntry, TollEntry } from "@/types/toll"

const COLLECTION = "tolls"

export function subscribeToTolls(
  onData: (entries: WithId<TollEntry>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<TollEntry>(COLLECTION, onData, onError, "date")
}

export function addToll(data: NewTollEntry): Promise<string> {
  return createDocument<NewTollEntry>(COLLECTION, data)
}

export function updateToll(id: string, data: Partial<NewTollEntry>): Promise<void> {
  return updateDocument<NewTollEntry>(COLLECTION, id, data)
}

export function deleteToll(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
