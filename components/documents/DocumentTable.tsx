"use client"

/**
 * DocumentTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Document Tracker module's container component — Firestore-backed,
 * following the pattern proven in TravellerTable/VehicleTable/etc.
 *
 * Naming note: individual entries are called `record` (not `document`)
 * throughout this file and in DocumentCard, to avoid shadowing the global
 * `window.document` object — a deliberate fix made before this Firestore
 * migration, preserved unchanged here. AddDocumentDialog's own prop is
 * still named `document` (see that file's comment) — only the local
 * variable name changed, not that contract.
 *
 * `fileReference` stays free text, not a real Firebase Storage upload —
 * see the top-level note in this migration's response for why that's a
 * deliberate scope boundary for this pass.
 */

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getErrorMessage } from "@/lib/firebase/errors"
import {
  addDocumentRecord,
  deleteDocumentRecord,
  subscribeToDocumentRecords,
  updateDocumentRecord,
} from "@/services/documents/documents.service"
import type { DocumentRecord, DocumentStatus, NewDocumentRecord } from "@/types/document"

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; record: DocumentRecord } | null

/** Kept local to each file that needs it (also duplicated in
 *  DocumentCard) rather than exported, purely to avoid a value-level
 *  circular import between the sibling files for small pure functions. */
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
/*                               Loading state                               */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-md" />
      ))}
    </div>
  )
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
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [attentionOnly, setAttentionOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<DocumentRecord | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Real-time Firestore subscription — fires immediately with the current
  // data, then again on every add/edit/delete from any browser/device.
  React.useEffect(() => {
    const unsubscribe = subscribeToDocumentRecords(
      (data) => {
        setDocuments(data)
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

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

  async function handleDialogSubmit(data: NewDocumentRecord, id?: string) {
    try {
      if (id) {
        await updateDocumentRecord(id, data)
        toast.success("Document updated")
      } else {
        await addDocumentRecord(data)
        toast.success("Document added")
      }
      setDialogState(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteDocumentRecord(deleteTarget.id)
      toast.success("Document removed")
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
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
      {loading ? (
        <LoadingState />
      ) : documents.length === 0 ? (
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
          or from any row/card's Edit action. AddDocumentDialog's own prop
          is still named `document` (its external contract, unchanged) —
          only this file's local `dialogState.record` field is renamed. */}
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
          if (!isOpen && !isDeleting) setDeleteTarget(null)
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
