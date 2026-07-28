"use client"

/**
 * TravellerTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Traveller Management module's container component — Firestore-
 * backed. "Assigned Vehicle" is now a real Vehicle reference
 * (assignedVehicleId + assignedVehicleName), not a fixed "Car A"/"Car B"
 * enum — see types/traveller.ts and AddTravellerDialog.tsx.
 *
 * This file adds a "Travellers by Vehicle" headcount summary, same shape
 * as the per-person/per-vehicle summaries in Expenses/Fuel/Tolls — useful
 * for balancing seating across vehicles. "Unassigned" always sorts last,
 * regardless of count, since it's the bucket that needs attention, not
 * a vehicle to compare against the others.
 */

import * as React from "react"
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
  Users,
  UserCheck,
  Car,
  type LucideIcon,
} from "lucide-react"

import { TravellerCard } from "./TravellerCard"
import { AddTravellerDialog } from "./AddTravellerDialog"
import { getErrorMessage } from "@/lib/firebase/errors"
import {
  addTraveller,
  deleteTraveller,
  subscribeToTravellers,
  updateTraveller,
} from "@/services/travellers/travellers.service"
import type { DocumentStatus, NewTraveller, Traveller } from "@/types/traveller"

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; traveller: Traveller } | null

/** Kept local to each file that needs it (also duplicated in TravellerCard)
 *  rather than exported, purely to avoid a value-level circular import
 *  between the sibling files for a 3-line pure function. */
function documentBadgeVariant(
  status: DocumentStatus
): "default" | "destructive" | "secondary" {
  if (status === "Valid") return "default"
  if (status === "Expired") return "destructive"
  return "secondary"
}

interface VehicleGroupCount {
  key: string
  label: string
  count: number
}

/* -------------------------------------------------------------------------- */
/*                       Travellers-by-vehicle summary                       */
/* -------------------------------------------------------------------------- */

interface VehicleGroupSummaryProps {
  groups: VehicleGroupCount[]
}

function VehicleGroupSummary({ groups }: VehicleGroupSummaryProps) {
  if (groups.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm font-medium">Travellers by Vehicle</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {groups.map((group) => (
          <div
            key={group.key}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
          >
            <span className="font-medium">{group.label}</span>
            <span className="text-muted-foreground">
              {group.count} traveller{group.count === 1 ? "" : "s"}
            </span>
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
  travellers: Traveller[]
  onEdit: (traveller: Traveller) => void
  onDelete: (traveller: Traveller) => void
}

function TableView({ travellers, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Blood Group</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Vehicle / Seat</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {travellers.map((traveller) => (
            <TableRow key={traveller.id}>
              <TableCell>
                <div className="font-medium">{traveller.name}</div>
                {traveller.nickname && (
                  <div className="text-xs text-muted-foreground">
                    &ldquo;{traveller.nickname}&rdquo;
                  </div>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {traveller.phone || "—"}
              </TableCell>
              <TableCell>{traveller.bloodGroup}</TableCell>
              <TableCell>
                {traveller.isDriver ? (
                  <Badge variant="outline">Driver</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {traveller.assignedVehicleName ?? "Unassigned"}
                {traveller.seatNumber ? ` · Seat ${traveller.seatNumber}` : ""}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge
                    variant={documentBadgeVariant(traveller.passportStatus)}
                    className="w-fit whitespace-nowrap"
                  >
                    Passport: {traveller.passportStatus}
                  </Badge>
                  <Badge
                    variant={documentBadgeVariant(traveller.voterIdStatus)}
                    className="w-fit whitespace-nowrap"
                  >
                    Voter ID: {traveller.voterIdStatus}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${traveller.name}`}
                    onClick={() => onEdit(traveller)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${traveller.name}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(traveller)}
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
/*                               TravellerTable                              */
/* -------------------------------------------------------------------------- */

export function TravellerTable() {
  const [travellers, setTravellers] = React.useState<Traveller[]>([])
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showDriversOnly, setShowDriversOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Traveller | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Real-time Firestore subscription — fires immediately with the current
  // data, then again on every add/edit/delete from any browser/device.
  React.useEffect(() => {
    const unsubscribe = subscribeToTravellers(
      (data) => {
        setTravellers(data)
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const filteredTravellers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return travellers.filter((traveller) => {
      if (showDriversOnly && !traveller.isDriver) return false
      if (!query) return true
      return (
        traveller.name.toLowerCase().includes(query) ||
        traveller.nickname.toLowerCase().includes(query) ||
        traveller.phone.toLowerCase().includes(query)
      )
    })
  }, [travellers, searchQuery, showDriversOnly])

  const driverCount = React.useMemo(
    () => travellers.filter((traveller) => traveller.isDriver).length,
    [travellers]
  )

  // Headcount per vehicle, "Unassigned" always sorted last regardless of
  // count — it's the bucket that needs attention, not one to compare.
  const vehicleGroups = React.useMemo<VehicleGroupCount[]>(() => {
    const byVehicle = new Map<string, VehicleGroupCount>()
    for (const traveller of travellers) {
      const key = traveller.assignedVehicleId ?? "unassigned"
      const label = traveller.assignedVehicleName ?? "Unassigned"
      const existing = byVehicle.get(key) ?? { key, label, count: 0 }
      existing.count += 1
      byVehicle.set(key, existing)
    }
    return Array.from(byVehicle.values()).sort((a, b) => {
      if (a.key === "unassigned") return 1
      if (b.key === "unassigned") return -1
      return b.count - a.count
    })
  }, [travellers])

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(traveller: Traveller) {
    setDialogState({ mode: "edit", traveller })
  }

  function handleDeleteClick(traveller: Traveller) {
    setDeleteTarget(traveller)
  }

  async function handleDialogSubmit(data: NewTraveller, id?: string) {
    try {
      if (id) {
        await updateTraveller(id, data)
        toast.success("Traveller updated")
      } else {
        await addTraveller(data)
        toast.success("Traveller added")
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
      await deleteTraveller(deleteTarget.id)
      toast.success("Traveller removed")
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
        <h2 className="text-lg font-semibold tracking-tight">Travellers</h2>
        <p className="text-sm text-muted-foreground">
          {travellers.length} traveller{travellers.length === 1 ? "" : "s"} ·{" "}
          {driverCount} driver{driverCount === 1 ? "" : "s"} assigned
        </p>
      </div>

      {/* Headcount per vehicle — only shown once there's data to summarize */}
      {!loading && <VehicleGroupSummary groups={vehicleGroups} />}

      {/* Toolbar: search, drivers-only filter, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, nickname, or phone…"
            className="pl-8"
            aria-label="Search travellers"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={showDriversOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={showDriversOnly}
            onClick={() => setShowDriversOnly((prev) => !prev)}
          >
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Drivers only
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
            Add Traveller
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : travellers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No travellers yet"
          description="Add everyone joining the trip — their contact details, driving status, and documents all live here."
          actionLabel="Add Traveller"
          onAction={handleAddClick}
        />
      ) : filteredTravellers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the drivers-only filter."
        />
      ) : viewMode === "table" ? (
        <TableView
          travellers={filteredTravellers}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTravellers.map((traveller) => (
            <TravellerCard
              key={traveller.id}
              traveller={traveller}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddTravellerDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        traveller={dialogState?.mode === "edit" ? dialogState.traveller : null}
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
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from the traveller list. This can&apos;t be undone
              from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
