"use client"

/**
 * AddEmergencyDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single emergency contact — no
 * <DialogTrigger> of its own, driven entirely by `open`/`contact` props
 * from EmergencyTable.
 *
 * Firestore migration change: `onSubmit` now receives the form data
 * (without an id) plus the existing id *only* when editing.
 *
 * Validation is stricter than most modules: Name AND Phone are both
 * required — a contact without a phone number defeats the point of this
 * module. Unchanged from the original design.
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

import type {
  EmergencyCategory,
  EmergencyContact,
  NewEmergencyContact,
} from "@/types/emergency"

const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  "Team",
  "Medical",
  "Police",
  "Insurance",
  "Embassy",
  "Vehicle Service",
  "Other",
]

interface AddEmergencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Contact being edited, or null/undefined to add a new one. */
  contact?: EmergencyContact | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewEmergencyContact, id?: string) => void
}

interface FormState {
  name: string
  category: EmergencyCategory
  phone: string
  city: string
  notes: string
}

function emptyForm(): FormState {
  return {
    name: "",
    category: "Team",
    phone: "",
    city: "",
    notes: "",
  }
}

function contactToForm(contact: EmergencyContact): FormState {
  return {
    name: contact.name,
    category: contact.category,
    phone: contact.phone,
    city: contact.city,
    notes: contact.notes,
  }
}

export function AddEmergencyDialog({
  open,
  onOpenChange,
  contact,
  onSubmit,
}: AddEmergencyDialogProps) {
  const isEditMode = Boolean(contact)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

  // Re-seed the form every time the dialog opens, matching whichever
  // contact (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(contact ? contactToForm(contact) : emptyForm())
    setError(null)
  }, [open, contact])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError("Name is required.")
      return
    }
    if (!form.phone.trim()) {
      setError("Phone number is required.")
      return
    }

    const data: NewEmergencyContact = {
      name: form.name.trim(),
      category: form.category,
      phone: form.phone.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
    }

    onSubmit(data, contact?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this emergency contact's details."
              : "Add someone the group might need to call in a hurry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency-name">Name *</Label>
              <Input
                id="emergency-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Trip Lead, City Hospital"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  updateField("category", value as EmergencyCategory)
                }
              >
                <SelectTrigger id="emergency-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMERGENCY_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-phone">Phone *</Label>
              <Input
                id="emergency-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 …"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-city">City</Label>
              <Input
                id="emergency-city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Where this contact applies, if relevant"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency-notes">Notes</Label>
            <Textarea
              id="emergency-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything else worth knowing"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Contact"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
