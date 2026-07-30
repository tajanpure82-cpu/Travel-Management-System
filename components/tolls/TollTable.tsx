"use client"

/**
 * TollTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Toll Log module's container component — Firestore-backed.
 *
 * Redesigned from two fixed "Car A" / "Car B" columns into a single
 * Vehicle + Amount per entry — see types/toll.ts for the full reasoning.
 * This file adds the Per-Vehicle Toll Summary section, same shape as
 * Fuel's Fuel Cost by Vehicle.
 *
 * Single currency (INR) only — unchanged, Nepal has no tolls on this
 * route.
 */

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Car,
  type LucideIcon,
} from "lucide-react"

import { TollCard } from "./TollCard"
import { AddTollDialog } from "./AddTollDialog"
import { getErrorMessage } from "@/lib/firebase/errors"
import {
  addToll,
  deleteToll,
  subscribeToTolls,
  updateToll,
} from "@/services/tolls/tolls.service"
import type { NewTollEntry, TollEntry } from "@/types/toll"

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

interface VehicleTotal {
  vehicleId: string
  vehicleName: string
  amount: number
}

/* -------------------------------------------------------------------------- */
/*                            Per-vehicle summary                            */
/* -------------------------------------------------------------------------- */

interface PerVehicleSummaryProps {
  totals: VehicleTotal[]
}

function PerVehicleSummary({ totals }: PerVehicleSummaryProps) {
  if (totals.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm font-medium">Toll Cost by Vehicle</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {totals.map((vehicle) => (
          <div
            key={vehicle.vehicleId}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
          >
            <span className="font-medium">{vehicle.vehicleName}</span>
            <span className="text-muted-foreground">{formatInr(vehicle.amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
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
            <TableHead>Vehicle</TableHead>
            <TableHead>Amount</TableHead>
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
              <TableCell className="text-muted-foreground">
                {entry.vehicleName || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {formatInr(entry.amount)}
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
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<TollEntry | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Real-time Firestore subscription — fires immediately with the current
  // data, then again on every add/edit/delete from any browser/device.
  React.useEffect(() => {
    const unsubscribe = subscribeToTolls(
      (data) => {
        setEntries(data)
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const filteredEntries = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return entries
    return entries.filter(
      (entry) =>
        entry.section.toLowerCase().includes(query) ||
        entry.vehicleName.toLowerCase().includes(query) ||
        entry.notes.toLowerCase().includes(query)
    )
  }, [entries, searchQuery])

  const totalAmount = React.useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amount, 0),
    [entries]
  )

  // Toll cost broken down by vehicle, ranked highest first.
  const perVehicleTotals = React.useMemo<VehicleTotal[]>(() => {
    const byVehicle = new Map<string, VehicleTotal>()
    for (const entry of entries) {
      if (!entry.vehicleId) continue
      const existing = byVehicle.get(entry.vehicleId) ?? {
        vehicleId: entry.vehicleId,
        vehicleName: entry.vehicleName || "Unknown",
        amount: 0,
      }
      existing.amount += entry.amount
      byVehicle.set(entry.vehicleId, existing)
    }
    return Array.from(byVehicle.values()).sort((a, b) => b.amount - a.amount)
  }, [entries])

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(entry: TollEntry) {
    setDialogState({ mode: "edit", entry })
  }

  function handleDeleteClick(entry: TollEntry) {
    setDeleteTarget(entry)
  }

  async function handleDialogSubmit(data: NewTollEntry, id?: string) {
    try {
      if (id) {
        await updateToll(id, data)
        toast.success("Toll entry updated")
      } else {
        await addToll(data)
        toast.success("Toll entry added")
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
      await deleteToll(deleteTarget.id)
      toast.success("Toll entry deleted")
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
        <h2 className="text-lg font-semibold tracking-tight">Toll Log</h2>
        <p className="text-sm text-muted-foreground">
          {entries.length} entr{entries.length === 1 ? "y" : "ies"} · {formatInr(totalAmount)}{" "}
          total
        </p>
      </div>

      {/* Per-vehicle breakdown — only shown once there's data to summarize */}
      {!loading && <PerVehicleSummary totals={perVehicleTotals} />}

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
            placeholder="Search by section, vehicle, or notes…"
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
      {loading ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title="No toll entries yet"
          description="Log every toll plaza per vehicle — tracked against FASTag or cash."
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
          if (!isOpen && !isDeleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this toll entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.section}" for ${deleteTarget.vehicleName || "this vehicle"} will be removed. This can't be undone from here.`
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
