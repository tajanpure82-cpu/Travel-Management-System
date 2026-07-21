"use client"

/**
 * FuelTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Fuel Log module's container component — same architecture as
 * TravellerTable/VehicleTable/ExpenseTable: owns the shared list state,
 * search, view-mode toggle, and the add/edit/delete flows. FuelCard and
 * AddFuelDialog are both presentational/controlled and take everything
 * they need as props.
 *
 * No backend: `entries` is local React state only, starting empty.
 *
 * Note: "Vehicle" is a free-text field rather than a live lookup into the
 * Vehicles module — same reasoning as Vehicles' "Driver Assigned": there's
 * no shared data layer between modules, so cross-referencing would be
 * fragile. Type in whatever name you gave the vehicle in that module.
 *
 * Rate per litre is a *derived* display value (amount / litres), not a
 * stored field — storing it separately would let it drift out of sync
 * with the amount and litres actually entered.
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
  Fuel as FuelIcon,
  type LucideIcon,
} from "lucide-react"

import { FuelCard } from "./FuelCard"
import { AddFuelDialog } from "./AddFuelDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type FuelCurrency = "INR" | "NPR"

export interface FuelEntry {
  id: string
  /** ISO date string, e.g. "2026-08-01". */
  date: string
  /** Free text — whatever name the vehicle was given in the Vehicles module. */
  vehicle: string
  location: string
  odometer: number | null
  litres: number
  amount: number
  currency: FuelCurrency
  fullTank: boolean
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; entry: FuelEntry } | null

/** Formats a stored ISO date string for display. Kept local rather than
 *  shared, matching this codebase's convention of duplicating small
 *  formatting helpers per file rather than adding a shared utils file. */
function formatDisplayDate(iso: string): string {
  if (!iso) return "—"
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "—"
}

function formatAmount(amount: number, currency: FuelCurrency): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return `NPR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`
}

/** Derived rate per litre — not stored, computed from amount/litres so it
 *  can never drift out of sync with those two fields. */
function ratePerLitre(entry: FuelEntry): string {
  if (entry.litres <= 0) return "—"
  const rate = entry.amount / entry.litres
  return `${formatAmount(rate, entry.currency)}/L`
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
  entries: FuelEntry[]
  onEdit: (entry: FuelEntry) => void
  onDelete: (entry: FuelEntry) => void
}

function TableView({ entries, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Litres</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Full Tank</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDisplayDate(entry.date)}
              </TableCell>
              <TableCell className="font-medium">{entry.vehicle || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {entry.location || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {entry.litres} L
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {ratePerLitre(entry)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {formatAmount(entry.amount, entry.currency)}
              </TableCell>
              <TableCell>
                {entry.fullTank ? (
                  <Badge variant="default">Full</Badge>
                ) : (
                  <Badge variant="outline">Partial</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit fuel entry at ${entry.location}`}
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete fuel entry at ${entry.location}`}
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
/*                                 FuelTable                                 */
/* -------------------------------------------------------------------------- */

export function FuelTable() {
  const [entries, setEntries] = React.useState<FuelEntry[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FuelEntry | null>(null)

  const filteredEntries = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return entries
    return entries.filter(
      (entry) =>
        entry.vehicle.toLowerCase().includes(query) ||
        entry.location.toLowerCase().includes(query) ||
        entry.notes.toLowerCase().includes(query)
    )
  }, [entries, searchQuery])

  const totals = React.useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        acc.litres += entry.litres
        if (entry.currency === "INR") acc.inr += entry.amount
        else acc.npr += entry.amount
        return acc
      },
      { litres: 0, inr: 0, npr: 0 }
    )
  }, [entries])

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(entry: FuelEntry) {
    setDialogState({ mode: "edit", entry })
  }

  function handleDeleteClick(entry: FuelEntry) {
    setDeleteTarget(entry)
  }

  function handleDialogSubmit(entry: FuelEntry) {
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

  const totalsSummary =
    totals.npr > 0
      ? `${totals.litres}L · ${formatAmount(totals.inr, "INR")} + ${formatAmount(totals.npr, "NPR")}`
      : `${totals.litres}L · ${formatAmount(totals.inr, "INR")}`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Fuel Log</h2>
        <p className="text-sm text-muted-foreground">
          {entries.length} entr{entries.length === 1 ? "y" : "ies"} · {totalsSummary}
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
            placeholder="Search by vehicle, location, or notes…"
            className="pl-8"
            aria-label="Search fuel entries"
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
            Add Fuel Entry
          </Button>
        </div>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <EmptyState
          icon={FuelIcon}
          title="No fuel entries yet"
          description="Log every fill-up — litres, cost, and whether it was a full tank all live here."
          actionLabel="Add Fuel Entry"
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
            <FuelCard
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
      <AddFuelDialog
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
            <AlertDialogTitle>Delete this fuel entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `The ${deleteTarget.litres}L fill-up at ${deleteTarget.location || "this location"} will be removed. This can't be undone from here.`
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
