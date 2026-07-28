"use client"

/**
 * AddTollDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single toll entry — no
 * <DialogTrigger> of its own, driven entirely by `open`/`entry` props
 * from TollTable.
 *
 * Type-safety sweep: onValueChange handlers now guard against Base UI's
 * Select passing `null` before use — `vehicleId` (plain string) falls
 * back to `""`, `method` (union) guards null before asserting. See
 * AddExpenseDialog.tsx for the full explanation.
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

import { subscribeToVehicles } from "@/services/vehicles/vehicles.service"
import type { Vehicle } from "@/types/vehicle"
import type { NewTollEntry, TollEntry, TollMethod } from "@/types/toll"

const TOLL_METHODS: TollMethod[] = ["FASTag", "Cash"]

interface AddTollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Entry being edited, or null/undefined to add a new one. */
  entry?: TollEntry | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewTollEntry, id?: string) => void
}

interface FormState {
  date: string
  section: string
  vehicleId: string
  amount: string
  method: TollMethod
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(): FormState {
  return {
    date: todayIso(),
    section: "",
    vehicleId: "",
    amount: "",
    method: "FASTag",
    notes: "",
  }
}

function entryToForm(entry: TollEntry): FormState {
  return {
    date: entry.date,
    section: entry.section,
    vehicleId: entry.vehicleId,
    amount: String(entry.amount),
    method: entry.method,
    notes: entry.notes,
  }
}

export function AddTollDialog({ open, onOpenChange, entry, onSubmit }: AddTollDialogProps) {
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

    if (!form.section.trim()) {
      setError("Section is required.")
      return
    }

    if (!form.vehicleId) {
      setError("Select which vehicle this toll was for.")
      return
    }

    const vehicle = vehicles.find((v) => v.id === form.vehicleId)
    if (!vehicle) {
      setError("That vehicle no longer exists — pick another.")
      return
    }

    const amount = Number(form.amount)
    if (form.amount.trim() === "" || Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount greater than 0.")
      return
    }

    const data: NewTollEntry = {
      date: form.date,
      section: form.section.trim(),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      amount,
      method: form.method,
      notes: form.notes.trim(),
    }

    onSubmit(data, entry?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Toll Entry" : "Add Toll Entry"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this toll entry's details."
              : "Log a toll plaza for one vehicle. If more than one vehicle crossed, log a separate entry for each."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="toll-section">Section *</Label>
              <Input
                id="toll-section"
                value={form.section}
                onChange={(e) => updateField("section", e.target.value)}
                placeholder="e.g. Samruddhi Mahamarg (full)"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toll-vehicle">Vehicle *</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(value) => updateField("vehicleId", value ?? "")}
              >
                <SelectTrigger id="toll-vehicle">
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
              <Label htmlFor="toll-date">Date</Label>
              <Input
                id="toll-date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toll-amount">Amount *</Label>
              <Input
                id="toll-amount"
                type="number"
                min={0}
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="e.g. 1400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toll-method">Method</Label>
              <Select
                value={form.method}
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("method", value as TollMethod)
                }}
              >
                <SelectTrigger id="toll-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOLL_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toll-notes">Notes</Label>
            <Textarea
              id="toll-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything worth remembering about this toll"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Toll Entry"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
