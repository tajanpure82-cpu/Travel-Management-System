"use client"

/**
 * EmergencyTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Emergency Contacts module's container component — same architecture
 * as TravellerTable/VehicleTable/etc: owns the shared list state, search,
 * view-mode toggle, and the add/edit/delete flows. EmergencyCard and
 * AddEmergencyDialog are both presentational/controlled and take
 * everything they need as props.
 *
 * No backend: `contacts` is local React state only, starting empty. Not
 * wired to Context yet — per current instructions, this module stays on
 * plain local state until the Dashboard integration work resumes.
 *
 * Phone numbers render as real `tel:` links here (not plain text, unlike
 * Hotels' contact phone field) — this is the one module where tap-to-call
 * is a genuinely justified feature given what it's for.
 *
 * Cards deliberately stay visually calm rather than red-accented across
 * the board — constant destructive styling on a reference list (most of
 * which is calm info like "Trip Lead: name, phone") would dilute the
 * signal value red carries elsewhere in this app (Vehicles' Maintenance,
 * Documents' Expired). The module's own icon and framing carry the
 * "emergency" context; individual contacts don't need to shout it too.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Plus,
  Table2,
  LayoutGrid,
  Pencil,
  Trash2,
  Siren,
  Phone,
  type LucideIcon,
} from "lucide-react"

import { EmergencyCard } from "./EmergencyCard"
import { AddEmergencyDialog } from "./AddEmergencyDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type EmergencyCategory =
  | "Team"
  | "Medical"
  | "Police"
  | "Insurance"
  | "Embassy"
  | "Vehicle Service"
  | "Other"

export interface EmergencyContact {
  id: string
  name: string
  category: EmergencyCategory
  phone: string
  /** Which city/context this contact applies to — free text, optional. */
  city: string
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; contact: EmergencyContact } | null

/* -------------------------------------------------------------------------- */
/*                                Empty state                                */
/* -------------------------------------------------------------------------- */

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button type="button" size="sm" className="mt-1 gap-1.5" onClick={onAction}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Table view                                */
/* -------------------------------------------------------------------------- */

interface TableViewProps {
  contacts: EmergencyContact[]
  onEdit: (contact: EmergencyContact) => void
  onDelete: (contact: EmergencyContact) => void
}

function TableView({ contacts, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{contact.name || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="whitespace-nowrap">
                  {contact.category}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{contact.city || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${contact.name}`}
                    onClick={() => onEdit(contact)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${contact.name}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(contact)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                EmergencyTable                             */
/* -------------------------------------------------------------------------- */

export function EmergencyTable() {
  const [contacts, setContacts] = React.useState<EmergencyContact[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<EmergencyContact | null>(null)

  const filteredContacts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.category.toLowerCase().includes(query) ||
        contact.city.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery])

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(contact: EmergencyContact) {
    setDialogState({ mode: "edit", contact })
  }

  function handleDeleteClick(contact: EmergencyContact) {
    setDeleteTarget(contact)
  }

  function handleDialogSubmit(contact: EmergencyContact) {
    setContacts((prev) => {
      const exists = prev.some((c) => c.id === contact.id)
      return exists
        ? prev.map((c) => (c.id === contact.id ? contact : c))
        : [...prev, contact]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Emergency Contacts</h2>
        <p className="text-sm text-muted-foreground">
          {contacts.length} contact{contacts.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Toolbar: search, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, category, or city…"
            className="pl-8"
            aria-label="Search emergency contacts"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border border-input p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
            >
              <Table2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              aria-pressed={viewMode === "card"}
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
          </div>

          <Button type="button" size="sm" className="gap-1.5" onClick={handleAddClick}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Content */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={Siren}
          title="No emergency contacts yet"
          description="Add the Trip Lead, hospitals, insurance helplines, and anyone else the group might need to call in a hurry."
          actionLabel="Add Contact"
          onAction={handleAddClick}
        />
      ) : filteredContacts.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term." />
      ) : viewMode === "table" ? (
        <TableView
          contacts={filteredContacts}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredContacts.map((contact) => (
            <EmergencyCard
              key={contact.id}
              contact={contact}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddEmergencyDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        contact={dialogState?.mode === "edit" ? dialogState.contact : null}
        onSubmit={handleDialogSubmit}
      />

      {/* Delete confirmation — also fully controlled, no AlertDialogTrigger. */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from the emergency contact list. This can&apos;t be
              undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
