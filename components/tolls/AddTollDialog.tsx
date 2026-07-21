"use client"

/**
 * AddTollDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single toll entry — same pattern
 * as AddFuelDialog / AddExpenseDialog / etc: no <DialogTrigger> of its
 * own, driven entirely by `open`/`entry` props from TollTable.
 *
 * Mode is inferred from `entry`: null/undefined = Add, a TollEntry = Edit.
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

import type { TollEntry, TollMethod } from "./TollTable"

// Local copy of the option list — kept in this file (rather than imported
// as a value from TollTable) purely to avoid a value-level circular
// import between the two sibling components. Only *types* are shared
// across files here.
const TOLL_METHODS: TollMethod[] = ["FASTag", "Cash"]

interface AddTollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Entry being edited, or null/undefined to add a new one. */
  entry?: TollEntry | null
  onSubmit: (entry: TollEntry) => void
}

interface FormState {
  date: string
  section: string
  carAAmount: string
  carBAmount: string
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
    carAAmount: "",
    carBAmount: "",
    method: "FASTag",
    notes: "",
  }
}

function entryToForm(entry: TollEntry): FormState {
  return {
    date: entry.date,
    section: entry.section,
    carAAmount: String(entry.carAAmount),
    carBAmount: String(entry.carBAmount),
    method: entry.method,
    notes: entry.notes,
  }
}

/** Parses a required amount field: empty/invalid/negative all become 0
 *  rather than blocking submission — a toll leg might genuinely apply to
 *  only one car, leaving the other at zero. */
function parseAmount(value: string): number {
  const trimmed = value.trim()
  if (trimmed === "") return 0
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

export function AddTollDialog({ open, onOpenChange, entry, onSubmit }: AddTollDialogProps) {
  const isEditMode = Boolean(entry)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

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

    const carAAmount = parseAmount(form.carAAmount)
    const carBAmount = parseAmount(form.carBAmount)

    if (carAAmount === 0 && carBAmount === 0) {
      setError("Enter an amount for at least one car.")
      return
    }

    onSubmit({
      id: entry?.id ?? crypto.randomUUID(),
      date: form.date,
      section: form.section.trim(),
      carAAmount,
      carBAmount,
      method: form.method,
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Toll Entry" : "Add Toll Entry"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this toll entry's details."
              : "Log a toll plaza, split by car."}
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
              <Label htmlFor="toll-date">Date</Label>
              <Input
                id="toll-date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toll-method">Method</Label>
              <Select
                value={form.method}
                onValueChange={(value) => updateField("method", value as TollMethod)}
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

            <div className="space-y-2">
              <Label htmlFor="toll-car-a">Car A Amount</Label>
              <Input
                id="toll-car-a"
                type="number"
                min={0}
                inputMode="decimal"
                value={form.carAAmount}
                onChange={(e) => updateField("carAAmount", e.target.value)}
                placeholder="e.g. 1400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toll-car-b">Car B Amount</Label>
              <Input
                id="toll-car-b"
                type="number"
                min={0}
                inputMode="decimal"
                value={form.carBAmount}
                onChange={(e) => updateField("carBAmount", e.target.value)}
                placeholder="e.g. 1400"
              />
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
