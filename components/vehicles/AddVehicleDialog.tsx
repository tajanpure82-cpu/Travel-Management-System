"use client"

/**
 * AddVehicleDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single vehicle — same pattern as
 * AddTravellerDialog: no <DialogTrigger> of its own, driven entirely by
 * `open`/`vehicle` props from VehicleTable.
 *
 * Mode is inferred from `vehicle`: null/undefined = Add, a Vehicle = Edit.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { Vehicle, VehicleType, FuelType, VehicleStatus } from "./VehicleTable"

// Local copies of the option lists — kept in this file (rather than
// imported as values from VehicleTable) purely to avoid a value-level
// circular import between the two sibling components. Only *types* are
// shared across files here.
const VEHICLE_TYPES: VehicleType[] = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Tempo Traveller",
  "Bike",
  "Bus",
  "Other",
]

const FUEL_TYPES: FuelType[] = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]

const VEHICLE_STATUSES: VehicleStatus[] = ["Available", "In Use", "Maintenance"]

interface AddVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Vehicle being edited, or null/undefined to add a new one. */
  vehicle?: Vehicle | null
  onSubmit: (vehicle: Vehicle) => void
}

interface FormState {
  name: string
  type: VehicleType
  registrationNumber: string
  seatingCapacity: string
  driverAssigned: string
  fuelType: FuelType
  mileage: string
  status: VehicleStatus
  notes: string
}

const EMPTY_FORM: FormState = {
  name: "",
  type: "SUV",
  registrationNumber: "",
  seatingCapacity: "",
  driverAssigned: "",
  fuelType: "Petrol",
  mileage: "",
  status: "Available",
  notes: "",
}

function vehicleToForm(vehicle: Vehicle): FormState {
  return {
    name: vehicle.name,
    type: vehicle.type,
    registrationNumber: vehicle.registrationNumber,
    seatingCapacity:
      vehicle.seatingCapacity !== null ? String(vehicle.seatingCapacity) : "",
    driverAssigned: vehicle.driverAssigned,
    fuelType: vehicle.fuelType,
    mileage: vehicle.mileage !== null ? String(vehicle.mileage) : "",
    status: vehicle.status,
    notes: vehicle.notes,
  }
}

/** Empty string → null; otherwise parse to a number (NaN also becomes null). */
/** Empty string -> null. Negative numbers and non-numeric input also
 *  become null -- the HTML `min` attribute on these inputs is only a
 *  soft hint (some mobile keyboards and manual edits can still produce
 *  a negative value), so this is the actual enforcement. */
function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export function AddVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onSubmit,
}: AddVehicleDialogProps) {
  const isEditMode = Boolean(vehicle)
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [error, setError] = React.useState<string | null>(null)

  // Re-seed the form every time the dialog opens, matching whichever
  // vehicle (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(vehicle ? vehicleToForm(vehicle) : EMPTY_FORM)
    setError(null)
  }, [open, vehicle])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError("Vehicle name is required.")
      return
    }

    onSubmit({
      id: vehicle?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      registrationNumber: form.registrationNumber.trim(),
      seatingCapacity: parseOptionalNumber(form.seatingCapacity),
      driverAssigned: form.driverAssigned.trim(),
      fuelType: form.fuelType,
      mileage: parseOptionalNumber(form.mileage),
      status: form.status,
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this vehicle's details."
              : "Add a car, bike, or tempo traveller to the fleet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicle-name">Vehicle Name *</Label>
              <Input
                id="vehicle-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Car A, Innova Crysta"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) => updateField("type", value as VehicleType)}
              >
                <SelectTrigger id="vehicle-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-registration">Registration Number</Label>
              <Input
                id="vehicle-registration"
                value={form.registrationNumber}
                onChange={(e) => updateField("registrationNumber", e.target.value)}
                placeholder="e.g. MH12AB1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-capacity">Seating Capacity</Label>
              <Input
                id="vehicle-capacity"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.seatingCapacity}
                onChange={(e) => updateField("seatingCapacity", e.target.value)}
                placeholder="e.g. 7"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-driver">Driver Assigned</Label>
              <Input
                id="vehicle-driver"
                value={form.driverAssigned}
                onChange={(e) => updateField("driverAssigned", e.target.value)}
                placeholder="Name or driver label"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-fuel">Fuel Type</Label>
              <Select
                value={form.fuelType}
                onValueChange={(value) => updateField("fuelType", value as FuelType)}
              >
                <SelectTrigger id="vehicle-fuel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>
                      {fuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-mileage">Mileage (km/l)</Label>
              <Input
                id="vehicle-mileage"
                type="number"
                min={0}
                step={0.1}
                inputMode="decimal"
                value={form.mileage}
                onChange={(e) => updateField("mileage", e.target.value)}
                placeholder="e.g. 13"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateField("status", value as VehicleStatus)}
              >
                <SelectTrigger id="vehicle-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-notes">Notes</Label>
            <Textarea
              id="vehicle-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Service history, quirks, anything the group should know"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Vehicle"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
