"use client"

/**
 * DocumentTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Document Tracker module's container component — same architecture
 * as TravellerTable/VehicleTable/ExpenseTable/FuelTable/HotelTable: owns
 * the shared list state, search, a "Needs Attention" filter, view-mode
 * toggle, and the add/edit/delete flows. DocumentCard and
 * AddDocumentDialog are both presentational/controlled and take
 * everything they need as props.
 *
 * No backend: `documents` is local React state only, starting empty.
 * This tracks vehicle documents (RC, insurance, PUC), trip permits
 * (Bhansar), and travel documents in one general list — it is not linked
 * to a specific traveller/vehicle record from those other modules; the
 * "Owner / Vehicle" field is free text, same reasoning as Vehicles'
 * "Driver Assigned" and Fuel's "Vehicle": no shared data layer exists
 * between modules yet.
 *
 * Naming note: individual entries are called `record` (not `document`)
 * throughout this file and in DocumentCard, to avoid shadowing the global
 * `window.document` object. AddDocumentDialog is untouched, so its prop
 * is still named `document` where this file calls it — only the local
 * variable name changed here, not that external contract.
 */

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"

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
  FolderOpen,
  type LucideIcon,
} from "lucide-react"

import { DocumentCard } from "./DocumentCard"
import { AddDocumentDialog } from "./AddDocumentDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type DocumentCategory =
  | "Vehicle RC"
  | "Vehicle Insurance"
  | "PUC"
  | "Travel Insurance"
  | "Passport"
  | "Voter ID"
  | "Driving Licence"
  | "Bhansar Permit"
  | "Other"

export type DocumentStatus = "Valid" | "Expiring Soon" | "Expired" | "Missing"

export interface DocumentRecord {
  id: string
  name: string
  category: DocumentCategory
  /** Free text — whose document this is, or which vehicle it belongs to. */
  ownerOrVehicle: string
  /** ISO date string, or null if not applicable / not yet known. */
  expiryDate: string | null
  status: DocumentStatus
  /** Where the physical/scanned copy actually is — free text. */
  fileReference: string
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; record: DocumentRecord } | null

/** Kept local to each file that needs it (also duplicated in DocumentCard)
 *  rather than exported, purely to avoid a value-level circular import
 *  between the sibling files for small pure functions. */
function statusBadgeVariant(
  status: DocumentStatus
): "default" | "secondary" | "destructive" {
  if (status === "Valid") return "default"
  if (status === "Expiring Soon") return "secondary"
  return "destructive" // Expired or Missing
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "No expiry"
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "No expiry"
}

function needsAttention(status: DocumentStatus): boolean {
  return status !== "Valid"
}

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
  documents: DocumentRecord[]
  onEdit: (record: DocumentRecord) => void
  onDelete: (record: DocumentRecord) => void
}

function TableView({ documents, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Owner / Vehicle</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.name || "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {record.category}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record.ownerOrVehicle || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDisplayDate(record.expiryDate)}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(record.status)} className="whitespace-nowrap">
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit document: ${record.name}`}
                    onClick={() => onEdit(record)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete document: ${record.name}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(record)}
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
/*                               DocumentTable                               */
/* -------------------------------------------------------------------------- */

export function DocumentTable() {
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [attentionOnly, setAttentionOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<DocumentRecord | null>(null)

  const filteredDocuments = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return documents.filter((record) => {
      if (attentionOnly && !needsAttention(record.status)) return false
      if (!query) return true
      return (
        record.name.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query) ||
        record.ownerOrVehicle.toLowerCase().includes(query)
      )
    })
  }, [documents, searchQuery, attentionOnly])

  const attentionCount = React.useMemo(
    () => documents.filter((record) => needsAttention(record.status)).length,
    [documents]
  )

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(record: DocumentRecord) {
    setDialogState({ mode: "edit", record })
  }

  function handleDeleteClick(record: DocumentRecord) {
    setDeleteTarget(record)
  }

  function handleDialogSubmit(record: DocumentRecord) {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === record.id)
      return exists
        ? prev.map((d) => (d.id === record.id ? record : d))
        : [...prev, record]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
        <p className="text-sm text-muted-foreground">
          {documents.length} document{documents.length === 1 ? "" : "s"} · {attentionCount} need
          {attentionCount === 1 ? "s" : ""} attention
        </p>
      </div>

      {/* Toolbar: search, needs-attention filter, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, category, or owner…"
            className="pl-8"
            aria-label="Search documents"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={attentionOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={attentionOnly}
            onClick={() => setAttentionOnly((prev) => !prev)}
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Needs attention
          </Button>

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
            Add Document
          </Button>
        </div>
      </div>

      {/* Content */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents tracked yet"
          description="RC, insurance, PUC, permits, passports — track expiry and status for everything the trip depends on."
          actionLabel="Add Document"
          onAction={handleAddClick}
        />
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the Needs Attention filter."
        />
      ) : viewMode === "table" ? (
        <TableView
          documents={filteredDocuments}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((record) => (
            <DocumentCard
              key={record.id}
              record={record}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. AddDocumentDialog is untouched,
          so its prop is still named `document` here — only the local
          `dialogState.record` field name changed. */}
      <AddDocumentDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        document={dialogState?.mode === "edit" ? dialogState.record : null}
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
            <AlertDialogTitle>Delete this document record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" will be removed. This can't be undone from here.`
                : "This can't be undone from here."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
