/**
 * Hotel booking types.
 * ─────────────────────────────────────────────────────────────────────────
 * `assignedTravellers` is a real many-to-many relationship — one booking
 * can have several travellers, unlike every other relationship in this
 * app so far (Expense→Traveller, Fuel→Vehicle, Toll→Vehicle,
 * Traveller→Vehicle), which are all single references. An array of
 * {travellerId, travellerName} pairs, rather than two parallel arrays of
 * IDs and names — keeps each pairing atomic so the two can't drift out
 * of sync in length or order.
 *
 * "City" stays a fixed Select (not free text) — the trip's route is a
 * real, frozen, closed set of cities, so a Select prevents typos that
 * would silently break search and filtering.
 */

export type HotelCity =
  | "Raipur"
  | "Puri"
  | "Kharagpur"
  | "Muzaffarpur"
  | "Kathmandu"
  | "Pokhara"
  | "Prayagraj"
  | "Nagpur"
  | "Varanasi"
  | "Chitwan"
  | "Other"

export type HotelCurrency = "INR" | "NPR"

export type BookingStatus = "Not Booked" | "Booked" | "Confirmed"

export interface AssignedTraveller {
  travellerId: string
  travellerName: string
}

export interface HotelBooking {
  id: string
  city: HotelCity
  hotelName: string
  /** ISO date string, e.g. "2026-08-01". */
  checkInDate: string
  nights: number | null
  rooms: number | null
  ratePerRoom: number | null
  currency: HotelCurrency
  parkingConfirmed: boolean
  freeCancellation: boolean
  status: BookingStatus
  contactPhone: string
  /** Travellers staying in this booking. Empty array if none assigned yet. */
  assignedTravellers: AssignedTraveller[]
  notes: string
}

/** Shape used when creating a new booking — no `id` yet, Firestore
 *  assigns it on create. */
export type NewHotelBooking = Omit<HotelBooking, "id">
