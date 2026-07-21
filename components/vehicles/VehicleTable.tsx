"use client"

/**
 * VehicleTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Vehicle Management module's container component — same architecture
 * as TravellerTable: owns the shared list state, search, view-mode toggle,
 * and the add/edit/delete flows. VehicleCard and AddVehicleDialog are both
 * presentational/controlled and take everything they need as props.
 *
 * No backend: `vehicles` is local React state only, starting empty. No
 * invented fleet data — a real empty state invites the first vehicle to
 * be added.
 *
 * Note: "Driver Assigned" is a free-text field here rather than a live
 * lookup into the Travellers module. The two modules have no shared data
 * layer yet (local state only, per module) — wiring them together would
 * need a shared store/context, which is out of scope for now.
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
  Car,
  type LucideIcon,
} from "lucide-react"

import { VehicleCard } from "./VehicleCard"
import { AddVehicleDialog } from "./AddVehicleDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type VehicleType =
  | "SUV"
  | "Sedan"
  | "Hatchback"
  | "Tempo Traveller"
  | "Bike"
  | "Bus"
  | "Other"

export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid"

export type VehicleStatus = "Available" | "In Use" | "Maintenance"

export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  registrationNumber: string
  seatingCapacity: number | null
  driverAssigned: string
  fuelType: FuelType
  mileage: number | null
  status: VehicleStatus
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; vehicle: Vehicle } | null

/** Kept local to each file that needs it (also duplicated in VehicleCard)
 *  rather than exported, purely to avoid a value-level circular import
 *  between the sibling files for a 3-line pure function. */
function statusBadgeVariant(
  status: VehicleStatus
): "default" | "secondary" | "destructive" {
  if (status === "Available") return "default"
  if (status === "In Use") return "secondary"
  return "destructive" // Maintenance
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
  vehicles: Vehicle[]
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

function TableView({ vehicles, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Registration</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Fuel</TableHead>
            <TableHead>Mileage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div className="font-medium">{vehicle.name}</div>
                <div className="text-xs text-muted-foreground">{vehicle.type}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {vehicle.registrationNumber || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {vehicle.seatingCapacity ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {vehicle.driverAssigned || "Unassigned"}
              </TableCell>
              <TableCell className="text-muted-foreground">{vehicle.fuelType}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {vehicle.mileage !== null ? `${vehicle.mileage} km/l` : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusBadgeVariant(vehicle.status)}
                  className="whitespace-nowrap"
                >
                  {vehicle.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${vehicle.name}`}
                    onClick={() => onEdit(vehicle)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${vehicle.name}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(vehicle)}
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
/*                                VehicleTable                               */
/* -------------------------------------------------------------------------- */

export function VehicleTable() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Vehicle | null>(null)

  const filteredVehicles = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return vehicles
    return vehicles.filter(
      (vehicle) =>
        vehicle.name.toLowerCase().includes(query) ||
        vehicle.registrationNumber.toLowerCase().includes(query) ||
        vehicle.driverAssigned.toLowerCase().includes(query)
    )
  }, [vehicles, searchQuery])

  const availableCount = React.useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "Available").length,
    [vehicles]
  )

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(vehicle: Vehicle) {
    setDialogState({ mode: "edit", vehicle })
  }

  function handleDeleteClick(vehicle: Vehicle) {
    setDeleteTarget(vehicle)
  }

  function handleDialogSubmit(vehicle: Vehicle) {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === vehicle.id)
      return exists
        ? prev.map((v) => (v.id === vehicle.id ? vehicle : v))
        : [...prev, vehicle]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Vehicles</h2>
        <p className="text-sm text-muted-foreground">
          {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} ·{" "}
          {availableCount} available
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
            placeholder="Search by name, registration, or driver…"
            className="pl-8"
            aria-label="Search vehicles"
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
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Content */}
      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add every car, bike, or tempo traveller in the fleet — driver assignment, fuel type, and status all live here."
          actionLabel="Add Vehicle"
          onAction={handleAddClick}
        />
      ) : filteredVehicles.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term." />
      ) : viewMode === "table" ? (
        <TableView
          vehicles={filteredVehicles}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddVehicleDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        vehicle={dialogState?.mode === "edit" ? dialogState.vehicle : null}
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
              This removes it from the fleet list. This can&apos;t be undone from
              here.
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
