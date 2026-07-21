"use client"

/**
 * AddHotelDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single hotel booking — same
 * pattern as AddTravellerDialog / AddVehicleDialog / AddExpenseDialog /
 * AddFuelDialog: no <DialogTrigger> of its own, driven entirely by
 * `open`/`booking` props from HotelTable.
 *
 * Mode is inferred from `booking`: null/undefined = Add, a HotelBooking = Edit.
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

import type {
  HotelBooking,
  HotelCity,
  HotelCurrency,
  BookingStatus,
} from "./HotelTable"

// Local copies of the option lists — kept in this file (rather than
// imported as values from HotelTable) purely to avoid a value-level
// circular import between the two sibling components. Only *types* are
// shared across files here.
const HOTEL_CITIES: HotelCity[] = [
  "Raipur",
  "Puri",
  "Kharagpur",
  "Muzaffarpur",
  "Kathmandu",
  "Pokhara",
  "Prayagraj",
  "Nagpur",
  "Varanasi",
  "Chitwan",
  "Other",
]

const HOTEL_CURRENCIES: HotelCurrency[] = ["INR", "NPR"]

const BOOKING_STATUSES: BookingStatus[] = ["Not Booked", "Booked", "Confirmed"]

interface AddHotelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Booking being edited, or null/undefined to add a new one. */
  booking?: HotelBooking | null
  onSubmit: (booking: HotelBooking) => void
}

interface FormState {
  city: HotelCity
  hotelName: string
  checkInDate: string
  nights: string
  rooms: string
  ratePerRoom: string
  currency: HotelCurrency
  parkingConfirmed: boolean
  freeCancellation: boolean
  status: BookingStatus
  contactPhone: string
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(): FormState {
  return {
    city: "Raipur",
    hotelName: "",
    checkInDate: todayIso(),
    nights: "1",
    rooms: "",
    ratePerRoom: "",
    currency: "INR",
    parkingConfirmed: false,
    freeCancellation: false,
    status: "Not Booked",
    contactPhone: "",
    notes: "",
  }
}

function bookingToForm(booking: HotelBooking): FormState {
  return {
    city: booking.city,
    hotelName: booking.hotelName,
    checkInDate: booking.checkInDate,
    nights: booking.nights !== null ? String(booking.nights) : "",
    rooms: booking.rooms !== null ? String(booking.rooms) : "",
    ratePerRoom: booking.ratePerRoom !== null ? String(booking.ratePerRoom) : "",
    currency: booking.currency,
    parkingConfirmed: booking.parkingConfirmed,
    freeCancellation: booking.freeCancellation,
    status: booking.status,
    contactPhone: booking.contactPhone,
    notes: booking.notes,
  }
}

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

export function AddHotelDialog({
  open,
  onOpenChange,
  booking,
  onSubmit,
}: AddHotelDialogProps) {
  const isEditMode = Boolean(booking)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

  // Re-seed the form every time the dialog opens, matching whichever
  // booking (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(booking ? bookingToForm(booking) : emptyForm())
    setError(null)
  }, [open, booking])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.hotelName.trim()) {
      setError("Hotel name is required.")
      return
    }

    onSubmit({
      id: booking?.id ?? crypto.randomUUID(),
      city: form.city,
      hotelName: form.hotelName.trim(),
      checkInDate: form.checkInDate,
      nights: parseOptionalNumber(form.nights),
      rooms: parseOptionalNumber(form.rooms),
      ratePerRoom: parseOptionalNumber(form.ratePerRoom),
      currency: form.currency,
      parkingConfirmed: form.parkingConfirmed,
      freeCancellation: form.freeCancellation,
      status: form.status,
      contactPhone: form.contactPhone.trim(),
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Booking" : "Add Booking"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this hotel booking's details."
              : "Track a hotel booking for one of the trip's cities."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hotel-city">City</Label>
              <Select
                value={form.city}
                onValueChange={(value) => updateField("city", value as HotelCity)}
              >
                <SelectTrigger id="hotel-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOTEL_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-name">Hotel Name *</Label>
              <Input
                id="hotel-name"
                value={form.hotelName}
                onChange={(e) => updateField("hotelName", e.target.value)}
                placeholder="e.g. Hotel ARRAJ"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-checkin">Check-in Date</Label>
              <Input
                id="hotel-checkin"
                type="date"
                value={form.checkInDate}
                onChange={(e) => updateField("checkInDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-nights">Nights</Label>
              <Input
                id="hotel-nights"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.nights}
                onChange={(e) => updateField("nights", e.target.value)}
                placeholder="e.g. 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-rooms">Rooms</Label>
              <Input
                id="hotel-rooms"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.rooms}
                onChange={(e) => updateField("rooms", e.target.value)}
                placeholder="e.g. 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-rate">Rate / Room / Night</Label>
              <Input
                id="hotel-rate"
                type="number"
                min={0}
                inputMode="decimal"
                value={form.ratePerRoom}
                onChange={(e) => updateField("ratePerRoom", e.target.value)}
                placeholder="e.g. 2200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) => updateField("currency", value as HotelCurrency)}
              >
                <SelectTrigger id="hotel-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOTEL_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-status">Booking Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateField("status", value as BookingStatus)}
              >
                <SelectTrigger id="hotel-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hotel-phone">Contact Phone</Label>
              <Input
                id="hotel-phone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="+91 …"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="hotel-parking"
                checked={form.parkingConfirmed}
                onCheckedChange={(checked) =>
                  updateField("parkingConfirmed", checked === true)
                }
              />
              <Label htmlFor="hotel-parking" className="cursor-pointer font-normal">
                Parking confirmed
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="hotel-cancellation"
                checked={form.freeCancellation}
                onCheckedChange={(checked) =>
                  updateField("freeCancellation", checked === true)
                }
              />
              <Label htmlFor="hotel-cancellation" className="cursor-pointer font-normal">
                Free cancellation
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotel-notes">Notes</Label>
            <Textarea
              id="hotel-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Booking reference, special requests, anything else"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Booking"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
