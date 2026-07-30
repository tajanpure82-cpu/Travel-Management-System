"use client"

/**
 * AddFuelDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single fuel entry — no
 * <DialogTrigger> of its own, driven entirely by `open`/`entry` props
 * from FuelTable.
 *
 * "Vehicle" is a live dropdown of real Vehicles. This dialog subscribes
 * to the Vehicles collection itself (read-only, just for the option
 * list).
 *
 * Legacy-data fix: `entryToForm` now defaults `vehicleId` to `""` if
 * missing — a fuel entry created before `vehicle` was renamed to
 * `vehicleId`/`vehicleName` has this field genuinely undefined, not
 * just empty. This doesn't crash (a Select with an unmatched value just
 * shows nothing selected), but it's still wrong to leave un-guarded —
 * the same class of gap that crashed AddExpenseDialog.tsx and
 * AddHotelDialog.tsx elsewhere in this app.
 *
 * The negative-number guard on odometer (added during the pre-backend
 * audit) is preserved unchanged here.
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
import type { FuelEntry, NewFuelEntry, FuelCurrency } from "@/types/fuel"

const FUEL_CURRENCIES: FuelCurrency[] = ["INR", "NPR"]

interface AddFuelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Entry being edited, or null/undefined to add a new one. */
  entry?: FuelEntry | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewFuelEntry, id?: string) => void
}

interface FormState {
  date: string
  vehicleId: string
  location: string
  odometer: string
  litres: string
  amount: string
  currency: FuelCurrency
  fullTank: boolean
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(): FormState {
  return {
    date: todayIso(),
    vehicleId: "",
    location: "",
    odometer: "",
    litres: "",
    amount: "",
    currency: "INR",
    fullTank: true,
    notes: "",
  }
}

function entryToForm(entry: FuelEntry): FormState {
  return {
    date: entry.date,
    vehicleId: entry.vehicleId ?? "",
    location: entry.location,
    odometer: entry.odometer !== null ? String(entry.odometer) : "",
    litres: String(entry.litres),
    amount: String(entry.amount),
    currency: entry.currency,
    fullTank: entry.fullTank,
    notes: entry.notes,
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

export function AddFuelDialog({ open, onOpenChange, entry, onSubmit }: AddFuelDialogProps) {
  const isEditMode = Boolean(entry)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])

  // Read-only subscription, just to populate the "Vehicle" dropdown with
  // real vehicles. This dialog never writes to the Vehicles collection.
  React.useEffect(() => {
    const unsubscribe = subscribeToVehicles((data) => setVehicles(data))
    return unsubscribe
  }, [])

  // Re-seed the form every time the dialog opens, matching whichever
  // entry (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(entry ? entryToForm(entry) : emptyForm())
    setError(null)
  }, [open, entry])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.vehicleId) {
      setError("Select which vehicle this fill-up was for.")
      return
    }

    const vehicle = vehicles.find((v) => v.id === form.vehicleId)
    if (!vehicle) {
      setError("That vehicle no longer exists — pick another.")
      return
    }

    const litres = Number(form.litres)
    if (form.litres.trim() === "" || Number.isNaN(litres) || litres <= 0) {
      setError("Enter a valid number of litres greater than 0.")
      return
    }

    const amount = Number(form.amount)
    if (form.amount.trim() === "" || Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount greater than 0.")
      return
    }

    const data: NewFuelEntry = {
      date: form.date,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      location: form.location.trim(),
      odometer: parseOptionalNumber(form.odometer),
      litres,
      amount,
      currency: form.currency,
      fullTank: form.fullTank,
      notes: form.notes.trim(),
    }

    onSubmit(data, entry?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Fuel Entry" : "Add Fuel Entry"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update this fill-up's details." : "Log a fill-up for the fleet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuel-vehicle">Vehicle *</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(value) => updateField("vehicleId", value ?? "")}
              >
                <SelectTrigger id="fuel-vehicle">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Add vehicles first
                    </div>
                  ) : (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-date">Date</Label>
              <Input
                id="fuel-date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fuel-location">Location / Fuel Station</Label>
              <Input
                id="fuel-location"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Indian Oil, Nagpur"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-litres">Litres *</Label>
              <Input
                id="fuel-litres"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={form.litres}
                onChange={(e) => updateField("litres", e.target.value)}
                placeholder="e.g. 45"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-odometer">Odometer (km)</Label>
              <Input
                id="fuel-odometer"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.odometer}
                onChange={(e) => updateField("odometer", e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-amount">Amount *</Label>
              <Input
                id="fuel-amount"
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="e.g. 4200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("currency", value as FuelCurrency)
                }}
              >
                <SelectTrigger id="fuel-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 sm:pt-2">
              <Checkbox
                id="fuel-full-tank"
                checked={form.fullTank}
                onCheckedChange={(checked) => updateField("fullTank", checked === true)}
              />
              <Label htmlFor="fuel-full-tank" className="cursor-pointer font-normal">
                This was a full tank
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel-notes">Notes</Label>
            <Textarea
              id="fuel-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything worth remembering about this fill-up"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Fuel Entry"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
