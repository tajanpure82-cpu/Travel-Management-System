/**
 * settings.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the trip settings singleton goes through this
 * file. Fixed collection + document path (settings/trip) — there is
 * exactly one settings record for the whole trip, not a list.
 */

import type { FirestoreError } from "firebase/firestore"

import { setDocumentData, subscribeToDocument } from "@/lib/firebase/crud"
import type { TripSettings } from "@/types/settings"

const COLLECTION = "settings"
const DOCUMENT_ID = "trip"

export function subscribeToTripSettings(
  onData: (settings: TripSettings | null) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToDocument<TripSettings>(COLLECTION, DOCUMENT_ID, onData, onError)
}

export function saveTripSettings(data: TripSettings): Promise<void> {
  return setDocumentData<TripSettings>(COLLECTION, DOCUMENT_ID, data)
}
