"use client"

/**
 * AddDocumentDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single document record — no
 * <DialogTrigger> of its own, driven entirely by `open`/`document` props
 * from DocumentTable.
 *
 * The prop is named `document` deliberately (DocumentTable's own internal
 * variable is `record`, to avoid shadowing `window.document`), destructured
 * as `document: documentRecord` here so this file doesn't shadow the
 * global either.
 *
 * Type-safety sweep: onValueChange handlers now guard against Base UI's
 * Select passing `null` before asserting to each field's literal union
 * type (category, status). See AddExpenseDialog.tsx for the full
 * explanation.
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
  DocumentCategory,
  DocumentRecord,
  DocumentStatus,
  NewDocumentRecord,
} from "@/types/document"

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "Vehicle RC",
  "Vehicle Insurance",
  "PUC",
  "Travel Insurance",
  "Passport",
  "Voter ID",
  "Driving Licence",
  "Bhansar Permit",
  "Other",
]

const DOCUMENT_STATUSES: DocumentStatus[] = ["Valid", "Expiring Soon", "Expired", "Missing"]

interface AddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Document being edited, or null/undefined to add a new one. */
  document?: DocumentRecord | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewDocumentRecord, id?: string) => void
}

interface FormState {
  name: string
  category: DocumentCategory
  ownerOrVehicle: string
  expiryDate: string
  status: DocumentStatus
  fileReference: string
  notes: string
}

function emptyForm(): FormState {
  return {
    name: "",
    category: "Vehicle RC",
    ownerOrVehicle: "",
    expiryDate: "",
    status: "Missing",
    fileReference: "",
    notes: "",
  }
}

function recordToForm(record: DocumentRecord): FormState {
  return {
    name: record.name,
    category: record.category,
    ownerOrVehicle: record.ownerOrVehicle,
    expiryDate: record.expiryDate ?? "",
    status: record.status,
    fileReference: record.fileReference,
    notes: record.notes,
  }
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  document: documentRecord,
  onSubmit,
}: AddDocumentDialogProps) {
  const isEditMode = Boolean(documentRecord)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

  // Re-seed the form every time the dialog opens, matching whichever
  // document (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(documentRecord ? recordToForm(documentRecord) : emptyForm())
    setError(null)
  }, [open, documentRecord])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError("Document name is required.")
      return
    }

    const data: NewDocumentRecord = {
      name: form.name.trim(),
      category: form.category,
      ownerOrVehicle: form.ownerOrVehicle.trim(),
      expiryDate: form.expiryDate.trim() === "" ? null : form.expiryDate,
      status: form.status,
      fileReference: form.fileReference.trim(),
      notes: form.notes.trim(),
    }

    onSubmit(data, documentRecord?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Document" : "Add Document"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this document's details."
              : "Track an RC, insurance, permit, or travel document."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="document-name">Document Name *</Label>
              <Input
                id="document-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Car A - RC, Rahul - Passport"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("category", value as DocumentCategory)
                }}
              >
                <SelectTrigger id="document-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-owner">Owner / Vehicle</Label>
              <Input
                id="document-owner"
                value={form.ownerOrVehicle}
                onChange={(e) => updateField("ownerOrVehicle", e.target.value)}
                placeholder="Name or vehicle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-expiry">Expiry Date</Label>
              <Input
                id="document-expiry"
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField("expiryDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("status", value as DocumentStatus)
                }}
              >
                <SelectTrigger id="document-status">
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

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="document-file-reference">File Reference</Label>
              <Input
                id="document-file-reference"
                value={form.fileReference}
                onChange={(e) => updateField("fileReference", e.target.value)}
                placeholder="e.g. Scanned copy in shared Drive folder"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-notes">Notes</Label>
            <Textarea
              id="document-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything else worth noting"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Document"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
