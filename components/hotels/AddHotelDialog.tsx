"use client"

/**
 * AddHotelDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single hotel booking — no
 * <DialogTrigger> of its own, driven entirely by `open`/`booking` props
 * from HotelTable.
 *
 * "Assigned Travellers" is a checkbox list (a real many-to-many
 * relationship, not a single Select) — see types/hotel.ts. This dialog
 * subscribes to the Travellers collection itself, read-only.
 *
 * Type-safety sweep: every Select's onValueChange handler now guards
 * against Base UI passing `null` before asserting to each field's
 * literal union type (city, currency, status). See AddExpenseDialog.tsx
 * for the full explanation. The Checkbox-based traveller list is
 * unaffected — Checkbox's onCheckedChange has a different, unrelated
 * signature.
 *
 * The negative-number guard on nights/rooms/ratePerRoom (added during
 * the pre-backend audit) is preserved unchanged here.
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

import { subscribeToTravellers } from "@/services/travellers/travellers.service"
import type { Traveller } from "@/types/traveller"
import type {
  AssignedTraveller,
  BookingStatus,
  HotelBooking,
  HotelCity,
  HotelCurrency,
  NewHotelBooking,
} from "@/types/hotel"

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
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewHotelBooking, id?: string) => void
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
  assignedTravellerIds: string[]
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
    assignedTravellerIds: [],
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
    assignedTravellerIds: booking.assignedTravellers.map((t) => t.travellerId),
    notes: booking.notes,
  }
}

/** Empty string -> null. Negative numbers and non-numeric input also
 *  become null -- the HTML `min` attribute on these inputs is only a
 *  soft hint, so this is the actual enforcement. */
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
  const [travellers, setTravellers] = React.useState<Traveller[]>([])

  // Read-only subscription, just to populate the traveller checkbox
  // list. This dialog never writes to the Travellers collection.
  React.useEffect(() => {
    const unsubscribe = subscribeToTravellers((data) => setTravellers(data))
    return unsubscribe
  }, [])

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

  function toggleTraveller(travellerId: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      assignedTravellerIds: checked
        ? [...prev.assignedTravellerIds, travellerId]
        : prev.assignedTravellerIds.filter((id) => id !== travellerId),
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.hotelName.trim()) {
      setError("Hotel name is required.")
      return
    }

    const assignedTravellers: AssignedTraveller[] = form.assignedTravellerIds
      .map((id) => {
        const traveller = travellers.find((t) => t.id === id)
        return traveller ? { travellerId: traveller.id, travellerName: traveller.name } : null
      })
      .filter((entry): entry is AssignedTraveller => entry !== null)

    const data: NewHotelBooking = {
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
      assignedTravellers,
      notes: form.notes.trim(),
    }

    onSubmit(data, booking?.id)
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
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("city", value as HotelCity)
                }}
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
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("currency", value as HotelCurrency)
                }}
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
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("status", value as BookingStatus)
                }}
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
            <Label>Assigned Travellers</Label>
            {travellers.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Add travellers first, then come back to assign them here.
              </p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                {travellers.map((traveller) => (
                  <div key={traveller.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`hotel-traveller-${traveller.id}`}
                      checked={form.assignedTravellerIds.includes(traveller.id)}
                      onCheckedChange={(checked) =>
                        toggleTraveller(traveller.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`hotel-traveller-${traveller.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {traveller.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
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
