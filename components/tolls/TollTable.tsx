"use client"

/**
 * TollTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Toll Log module's container component — same architecture as
 * FuelTable/HotelTable/etc: owns the shared list state, search, view-mode
 * toggle, and the add/edit/delete flows. TollCard and AddTollDialog are
 * both presentational/controlled and take everything they need as props.
 *
 * No backend: `entries` is local React state only, starting empty.
 *
 * Fields (Date, Section, Car A amount, Car B amount, Method, Notes) mirror
 * this project's own Toll Log structure rather than an invented shape.
 * Single currency (INR) only — Nepal has no tolls on this route, so a
 * dual-currency split like Expenses/Fuel/Hotels isn't needed here.
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
  Route as RouteIcon,
  type LucideIcon,
} from "lucide-react"

import { TollCard } from "./TollCard"
import { AddTollDialog } from "./AddTollDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type TollMethod = "FASTag" | "Cash"

export interface TollEntry {
  id: string
  /** ISO date string, e.g. "2026-08-01". */
  date: string
  /** e.g. "Samruddhi Mahamarg (full)", "Nagpur -> Raipur". */
  section: string
  carAAmount: number
  carBAmount: number
  method: TollMethod
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; entry: TollEntry } | null

function formatDisplayDate(iso: string): string {
  if (!iso) return "—"
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "—"
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Total for one entry — both cars combined. */
function entryTotal(entry: TollEntry): number {
  return entry.carAAmount + entry.carBAmount
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
  entries: TollEntry[]
  onEdit: (entry: TollEntry) => void
  onDelete: (entry: TollEntry) => void
}

function TableView({ entries, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Car A</TableHead>
            <TableHead>Car B</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDisplayDate(entry.date)}
              </TableCell>
              <TableCell className="font-medium">{entry.section || "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatInr(entry.carAAmount)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatInr(entry.carBAmount)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {formatInr(entryTotal(entry))}
              </TableCell>
              <TableCell>
                <Badge variant={entry.method === "FASTag" ? "default" : "outline"}>
                  {entry.method}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit toll entry: ${entry.section}`}
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete toll entry: ${entry.section}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(entry)}
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
/*                                 TollTable                                 */
/* -------------------------------------------------------------------------- */

export function TollTable() {
  const [entries, setEntries] = React.useState<TollEntry[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<TollEntry | null>(null)

  const filteredEntries = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return entries
    return entries.filter(
      (entry) =>
        entry.section.toLowerCase().includes(query) ||
        entry.notes.toLowerCase().includes(query)
    )
  }, [entries, searchQuery])

  const totalAmount = React.useMemo(
    () => entries.reduce((sum, entry) => sum + entryTotal(entry), 0),
    [entries]
  )

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(entry: TollEntry) {
    setDialogState({ mode: "edit", entry })
  }

  function handleDeleteClick(entry: TollEntry) {
    setDeleteTarget(entry)
  }

  function handleDialogSubmit(entry: TollEntry) {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id)
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Toll Log</h2>
        <p className="text-sm text-muted-foreground">
          {entries.length} entr{entries.length === 1 ? "y" : "ies"} · {formatInr(totalAmount)}{" "}
          total
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
            placeholder="Search by section or notes…"
            className="pl-8"
            aria-label="Search toll entries"
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
            Add Toll Entry
          </Button>
        </div>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title="No toll entries yet"
          description="Log every toll plaza — split by car, tracked against FASTag or cash."
          actionLabel="Add Toll Entry"
          onAction={handleAddClick}
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term." />
      ) : viewMode === "table" ? (
        <TableView
          entries={filteredEntries}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEntries.map((entry) => (
            <TollCard
              key={entry.id}
              entry={entry}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddTollDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        entry={dialogState?.mode === "edit" ? dialogState.entry : null}
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
            <AlertDialogTitle>Delete this toll entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.section}" will be removed. This can't be undone from here.`
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
