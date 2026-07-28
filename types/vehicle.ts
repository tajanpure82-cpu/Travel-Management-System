/**
 * Vehicle types.
 * ─────────────────────────────────────────────────────────────────────────
 * Moved out of VehicleTable.tsx so the service layer (which talks to
 * Firestore, not to any component) can use this type independently — same
 * reasoning as types/traveller.ts.
 */

export type VehicleType =
  | "SUV"
  | "Sedan"
  | "Hatchback"
  | "Tempo Traveller"
  | "Bike"
  | "Bus"
  | "Other"

export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid"

export type VehicleStatus = "Available" | "In Use" | "Maintenance"

export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  registrationNumber: string
  seatingCapacity: number | null
  driverAssigned: string
  fuelType: FuelType
  mileage: number | null
  status: VehicleStatus
  notes: string
}

/** Shape used when creating a new vehicle — no `id` yet, Firestore
 *  assigns it on create. */
export type NewVehicle = Omit<Vehicle, "id">
