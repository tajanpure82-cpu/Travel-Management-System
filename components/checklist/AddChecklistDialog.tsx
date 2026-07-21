"use client"

/**
 * AddChecklistDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single checklist item — same
 * pattern as AddTravellerDialog / AddVehicleDialog / etc: no
 * <DialogTrigger> of its own, driven entirely by `open`/`item` props from
 * ChecklistTable.
 *
 * Mode is inferred from `item`: null/undefined = Add, a ChecklistItem = Edit.
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
  ChecklistItem,
  ChecklistCategory,
  ChecklistPriority,
} from "./ChecklistTable"

// Local copies of the option lists — kept in this file (rather than
// imported as values from ChecklistTable) purely to avoid a value-level
// circular import between the two sibling components. Only *types* are
// shared across files here.
const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  "Pre-Trip",
  "Documents",
  "Vehicle",
  "Packing",
  "Daily",
  "Other",
]

const CHECKLIST_PRIORITIES: ChecklistPriority[] = ["Low", "Medium", "High"]

interface AddChecklistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Item being edited, or null/undefined to add a new one. */
  item?: ChecklistItem | null
  onSubmit: (item: ChecklistItem) => void
}

interface FormState {
  title: string
  category: ChecklistCategory
  priority: ChecklistPriority
  completed: boolean
  notes: string
}

function emptyForm(): FormState {
  return {
    title: "",
    category: "Pre-Trip",
    priority: "Medium",
    completed: false,
    notes: "",
  }
}

function itemToForm(item: ChecklistItem): FormState {
  return {
    title: item.title,
    category: item.category,
    priority: item.priority,
    completed: item.completed,
    notes: item.notes,
  }
}

export function AddChecklistDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
}: AddChecklistDialogProps) {
  const isEditMode = Boolean(item)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

  // Re-seed the form every time the dialog opens, matching whichever item
  // (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(item ? itemToForm(item) : emptyForm())
    setError(null)
  }, [open, item])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }

    onSubmit({
      id: item?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      completed: form.completed,
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this checklist item's details."
              : "Add something to track before or during the trip."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checklist-title">Title *</Label>
            <Input
              id="checklist-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Confirm 6th driver"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checklist-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  updateField("category", value as ChecklistCategory)
                }
              >
                <SelectTrigger id="checklist-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checklist-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  updateField("priority", value as ChecklistPriority)
                }
              >
                <SelectTrigger id="checklist-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="checklist-completed"
              checked={form.completed}
              onCheckedChange={(checked) => updateField("completed", checked === true)}
            />
            <Label htmlFor="checklist-completed" className="cursor-pointer font-normal">
              Already completed
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checklist-notes">Notes</Label>
            <Textarea
              id="checklist-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any detail worth remembering"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Item"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
