/**
 * emergency.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "emergencyContacts" collection goes
 * through this file. Ordered by name.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { EmergencyContact, NewEmergencyContact } from "@/types/emergency"

const COLLECTION = "emergencyContacts"

export function subscribeToEmergencyContacts(
  onData: (contacts: WithId<EmergencyContact>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<EmergencyContact>(COLLECTION, onData, onError, "name")
}

export function addEmergencyContact(data: NewEmergencyContact): Promise<string> {
  return createDocument<NewEmergencyContact>(COLLECTION, data)
}

export function updateEmergencyContact(
  id: string,
  data: Partial<NewEmergencyContact>
): Promise<void> {
  return updateDocument<NewEmergencyContact>(COLLECTION, id, data)
}

export function deleteEmergencyContact(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
