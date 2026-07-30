/**
 * hotels.service
 * ─────────────────────────────────────────────────────────────────────────
 * All Firestore access for the "hotelBookings" collection goes through
 * this file. Ordered by check-in date.
 */

import type { FirestoreError } from "firebase/firestore"

import {
  createDocument,
  deleteDocument,
  subscribeToCollection,
  updateDocument,
  type WithId,
} from "@/lib/firebase/crud"
import type { HotelBooking, NewHotelBooking } from "@/types/hotel"

const COLLECTION = "hotelBookings"

export function subscribeToHotelBookings(
  onData: (bookings: WithId<HotelBooking>[]) => void,
  onError?: (error: FirestoreError) => void
) {
  return subscribeToCollection<HotelBooking>(COLLECTION, onData, onError, "checkInDate")
}

export function addHotelBooking(data: NewHotelBooking): Promise<string> {
  return createDocument<NewHotelBooking>(COLLECTION, data)
}

export function updateHotelBooking(
  id: string,
  data: Partial<NewHotelBooking>
): Promise<void> {
  return updateDocument<NewHotelBooking>(COLLECTION, id, data)
}

export function deleteHotelBooking(id: string): Promise<void> {
  return deleteDocument(COLLECTION, id)
}
