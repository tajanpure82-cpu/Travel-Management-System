/**
 * vehicles.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "vehicles" collection goes through this
 * file — components never call Firestore directly. Same shape as
 * services/travellers/travellers.service.ts.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { NewVehicle, Vehicle } from "@/types/vehicle"

const COLLECTION = "vehicles"

export function subscribeToVehicles(
  onData: (vehicles: WithId<Vehicle>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<Vehicle>(COLLECTION, onData, onError, "name")
}

export function addVehicle(data: NewVehicle): Promise<string> {
  return createDocument<NewVehicle>(COLLECTION, data)
}

export function updateVehicle(id: string, data: Partial<NewVehicle>): Promise<void> {
  return updateDocument<NewVehicle>(COLLECTION, id, data)
}

export function deleteVehicle(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
