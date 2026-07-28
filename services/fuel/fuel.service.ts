/**
 * fuel.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "fuelEntries" collection goes through this
 * file. Ordered by date.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { FuelEntry, NewFuelEntry } from "@/types/fuel"

const COLLECTION = "fuelEntries"

export function subscribeToFuelEntries(
  onData: (entries: WithId<FuelEntry>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<FuelEntry>(COLLECTION, onData, onError, "date")
}

export function addFuelEntry(data: NewFuelEntry): Promise<string> {
  return createDocument<NewFuelEntry>(COLLECTION, data)
}

export function updateFuelEntry(id: string, data: Partial<NewFuelEntry>): Promise<void> {
  return updateDocument<NewFuelEntry>(COLLECTION, id, data)
}

export function deleteFuelEntry(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
