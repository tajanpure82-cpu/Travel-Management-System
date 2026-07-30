/**
 * travellers.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "travellers" collection goes through this
 * file — components never call Firestore directly. This is the pattern
 * every other module's services/<module>/<module>.service.ts follows
 * exactly, swapping the collection name and type.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { NewTraveller, Traveller } from "@/types/traveller"

const COLLECTION = "travellers"

export function subscribeToTravellers(
  onData: (travellers: WithId<Traveller>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<Traveller>(COLLECTION, onData, onError, "name")
}

export function addTraveller(data: NewTraveller): Promise<string> {
  return createDocument<NewTraveller>(COLLECTION, data)
}

export function updateTraveller(id: string, data: Partial<NewTraveller>): Promise<void> {
  return updateDocument<NewTraveller>(COLLECTION, id, data)
}

export function deleteTraveller(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
