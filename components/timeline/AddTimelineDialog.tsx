"use client"

/**
 * AddTimelineDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single timeline entry — no
 * <DialogTrigger> of its own, driven entirely by `open`/`entry` props
 * from TimelineTable.
 *
 * Type-safety sweep: onValueChange now guards against Base UI's Select
 * passing `null` before asserting to the status union type. See
 * AddExpenseDialog.tsx for the full explanation.
 *
 * The negative-number guard on day/distanceKm (added during the
 * pre-backend audit) is preserved unchanged here.
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

import type { NewTimelineEntry, TimelineEntry, TimelineStatus } from "@/types/timeline"

const TIMELINE_STATUSES: TimelineStatus[] = ["Upcoming", "In Progress", "Completed"]

interface AddTimelineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Entry being edited, or null/undefined to add a new one. */
  entry?: TimelineEntry | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewTimelineEntry, id?: string) => void
}

interface FormState {
  day: string
  date: string
  title: string
  distanceKm: string
  status: TimelineStatus
  notes: string
}

function emptyForm(): FormState {
  return {
    day: "",
    date: "",
    title: "",
    distanceKm: "",
    status: "Upcoming",
    notes: "",
  }
}

function entryToForm(entry: TimelineEntry): FormState {
  return {
    day: entry.day !== null ? String(entry.day) : "",
    date: entry.date ?? "",
    title: entry.title,
    distanceKm: entry.distanceKm !== null ? String(entry.distanceKm) : "",
    status: entry.status,
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

export function AddTimelineDialog({
  open,
  onOpenChange,
  entry,
  onSubmit,
}: AddTimelineDialogProps) {
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

    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }

    const data: NewTimelineEntry = {
      day: parseOptionalNumber(form.day),
      date: form.date.trim() === "" ? null : form.date,
      title: form.title.trim(),
      distanceKm: parseOptionalNumber(form.distanceKm),
      status: form.status,
      notes: form.notes.trim(),
    }

    onSubmit(data, entry?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Leg" : "Add Leg"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this timeline entry's details."
              : "Add a day, a route leg, or any other point on the trip."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeline-title">Title *</Label>
            <Input
              id="timeline-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Nashik → Raipur"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timeline-day">Day Number</Label>
              <Input
                id="timeline-day"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.day}
                onChange={(e) => updateField("day", e.target.value)}
                placeholder="e.g. 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-date">Date</Label>
              <Input
                id="timeline-date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-distance">Distance (km)</Label>
              <Input
                id="timeline-distance"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.distanceKm}
                onChange={(e) => updateField("distanceKm", e.target.value)}
                placeholder="e.g. 840"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("status", value as TimelineStatus)
                }}
              >
                <SelectTrigger id="timeline-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline-notes">Notes</Label>
            <Textarea
              id="timeline-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Route detail, risk, anything worth remembering"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Leg"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
