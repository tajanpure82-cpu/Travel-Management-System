"use client"

/**
 * AddTravellerDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single traveller. No
 * <DialogTrigger> of its own — TravellerTable opens it for both the
 * "Add" button and every row/card's "Edit" action.
 *
 * "Assigned Vehicle" is now a live dropdown of real Vehicles, not a fixed
 * "Car A"/"Car B" enum — same pattern as Fuel's and Tolls' vehicle
 * dropdowns. This dialog subscribes to the Vehicles collection itself
 * (read-only, just for the option list). "none" is used as the sentinel
 * value for "Unassigned" in the Select, same convention already
 * established here for the Seat Number field.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

import { subscribeToVehicles } from "@/services/vehicles/vehicles.service"
import type { Vehicle } from "@/types/vehicle"
import type {
  Traveller,
  NewTraveller,
  BloodGroup,
  SeatNumber,
  DocumentStatus,
} from "@/types/traveller"

const BLOOD_GROUPS: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
]

const DOCUMENT_STATUSES: DocumentStatus[] = ["Valid", "Expired", "Not Provided"]

const SEAT_NUMBERS: SeatNumber[] = [1, 2, 3, 4, 5]

interface AddTravellerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Traveller being edited, or null/undefined to add a new one. */
  traveller?: Traveller | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewTraveller, id?: string) => void
}

interface FormState {
  name: string
  nickname: string
  phone: string
  emergencyContact: string
  bloodGroup: BloodGroup
  isDriver: boolean
  assignedVehicleId: string
  seatNumber: SeatNumber | null
  passportStatus: DocumentStatus
  voterIdStatus: DocumentStatus
  medicalNotes: string
}

const EMPTY_FORM: FormState = {
  name: "",
  nickname: "",
  phone: "",
  emergencyContact: "",
  bloodGroup: "Unknown",
  isDriver: false,
  assignedVehicleId: "none",
  seatNumber: null,
  passportStatus: "Not Provided",
  voterIdStatus: "Not Provided",
  medicalNotes: "",
}

function travellerToForm(traveller: Traveller): FormState {
  return {
    name: traveller.name,
    nickname: traveller.nickname,
    phone: traveller.phone,
    emergencyContact: traveller.emergencyContact,
    bloodGroup: traveller.bloodGroup,
    isDriver: traveller.isDriver,
    assignedVehicleId: traveller.assignedVehicleId ?? "none",
    seatNumber: traveller.seatNumber,
    passportStatus: traveller.passportStatus,
    voterIdStatus: traveller.voterIdStatus,
    medicalNotes: traveller.medicalNotes,
  }
}

export function AddTravellerDialog({
  open,
  onOpenChange,
  traveller,
  onSubmit,
}: AddTravellerDialogProps) {
  const isEditMode = Boolean(traveller)
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [error, setError] = React.useState<string | null>(null)
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])

  // Read-only subscription, just to populate the "Assigned Vehicle"
  // dropdown with real vehicles. This dialog never writes to the
  // Vehicles collection.
  React.useEffect(() => {
    const unsubscribe = subscribeToVehicles((data) => setVehicles(data))
    return unsubscribe
  }, [])

  // Re-seed the form whenever the dialog opens, matching whichever
  // traveller (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(traveller ? travellerToForm(traveller) : EMPTY_FORM)
    setError(null)
  }, [open, traveller])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError("Name is required.")
      return
    }

    const assignedVehicle =
      form.assignedVehicleId !== "none"
        ? vehicles.find((v) => v.id === form.assignedVehicleId)
        : undefined

    const data: NewTraveller = {
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      phone: form.phone.trim(),
      emergencyContact: form.emergencyContact.trim(),
      bloodGroup: form.bloodGroup,
      isDriver: form.isDriver,
      assignedVehicleId: assignedVehicle?.id ?? null,
      assignedVehicleName: assignedVehicle?.name ?? null,
      seatNumber: form.seatNumber,
      passportStatus: form.passportStatus,
      voterIdStatus: form.voterIdStatus,
      medicalNotes: form.medicalNotes.trim(),
    }

    onSubmit(data, traveller?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Traveller" : "Add Traveller"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this traveller's details."
              : "Add someone joining the trip."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="traveller-name">Name *</Label>
              <Input
                id="traveller-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Full name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-nickname">Nickname</Label>
              <Input
                id="traveller-nickname"
                value={form.nickname}
                onChange={(e) => updateField("nickname", e.target.value)}
                placeholder="What the group calls them"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-phone">Phone</Label>
              <Input
                id="traveller-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-emergency">Emergency Contact</Label>
              <Input
                id="traveller-emergency"
                value={form.emergencyContact}
                onChange={(e) => updateField("emergencyContact", e.target.value)}
                placeholder="Name + phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-blood-group">Blood Group</Label>
              <Select
                value={form.bloodGroup}
                onValueChange={(value) => updateField("bloodGroup", value as BloodGroup)}
              >
                <SelectTrigger id="traveller-blood-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:self-end sm:pb-2">
              <Checkbox
                id="traveller-is-driver"
                checked={form.isDriver}
                onCheckedChange={(checked) =>
                  updateField("isDriver", checked === true)
                }
              />
              <Label htmlFor="traveller-is-driver" className="cursor-pointer font-normal">
                This person is a driver
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-vehicle">Assigned Vehicle</Label>
              <Select
                value={form.assignedVehicleId}
                onValueChange={(value) => updateField("assignedVehicleId", value)}
              >
                <SelectTrigger id="traveller-vehicle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-seat">Seat Number</Label>
              <Select
                value={form.seatNumber ? String(form.seatNumber) : "none"}
                onValueChange={(value) =>
                  updateField(
                    "seatNumber",
                    value === "none" ? null : (Number(value) as SeatNumber)
                  )
                }
              >
                <SelectTrigger id="traveller-seat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {SEAT_NUMBERS.map((seat) => (
                    <SelectItem key={seat} value={String(seat)}>
                      Seat {seat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-passport">Passport Status</Label>
              <Select
                value={form.passportStatus}
                onValueChange={(value) =>
                  updateField("passportStatus", value as DocumentStatus)
                }
              >
                <SelectTrigger id="traveller-passport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="traveller-voter-id">Voter ID Status</Label>
              <Select
                value={form.voterIdStatus}
                onValueChange={(value) =>
                  updateField("voterIdStatus", value as DocumentStatus)
                }
              >
                <SelectTrigger id="traveller-voter-id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="traveller-medical">Medical Notes</Label>
            <Textarea
              id="traveller-medical"
              value={form.medicalNotes}
              onChange={(e) => updateField("medicalNotes", e.target.value)}
              placeholder="Allergies, conditions, medication — anything the group should know"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Save Changes" : "Add Traveller"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
