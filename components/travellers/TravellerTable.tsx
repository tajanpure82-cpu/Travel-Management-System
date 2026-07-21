"use client"

/**
 * TravellerTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Traveller Management module's container component. Despite the
 * filename, this owns BOTH the Table View and the Card View (toggle at
 * the top), plus search, the "drivers only" filter, and the add/edit/
 * delete flows — it's the whole module, not just the table. The three
 * files in this folder were scoped as an exact set, so this is the
 * natural place for the shared list state to live (TravellerCard and
 * AddTravellerDialog are both presentational/controlled and take
 * everything they need as props).
 *
 * No backend: `travellers` is local React state only, starting empty.
 * Nothing here is seeded with invented names — this ships as a genuinely
 * empty list with a real empty state, ready for the group to fill in.
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
  Users,
  UserCheck,
  type LucideIcon,
} from "lucide-react"

import { TravellerCard } from "./TravellerCard"
import { AddTravellerDialog } from "./AddTravellerDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "Unknown"

export type VehicleAssignment = "Unassigned" | "Car A" | "Car B"

export type SeatNumber = 1 | 2 | 3 | 4 | 5

export type DocumentStatus = "Valid" | "Expired" | "Not Provided"

export interface Traveller {
  id: string
  name: string
  nickname: string
  phone: string
  emergencyContact: string
  bloodGroup: BloodGroup
  isDriver: boolean
  assignedVehicle: VehicleAssignment
  seatNumber: SeatNumber | null
  passportStatus: DocumentStatus
  voterIdStatus: DocumentStatus
  medicalNotes: string
}

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
                {traveller.assignedVehicle}
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
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showDriversOnly, setShowDriversOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Traveller | null>(null)

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

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(traveller: Traveller) {
    setDialogState({ mode: "edit", traveller })
  }

  function handleDeleteClick(traveller: Traveller) {
    setDeleteTarget(traveller)
  }

  function handleDialogSubmit(traveller: Traveller) {
    setTravellers((prev) => {
      const exists = prev.some((t) => t.id === traveller.id)
      return exists
        ? prev.map((t) => (t.id === traveller.id ? traveller : t))
        : [...prev, traveller]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setTravellers((prev) => prev.filter((t) => t.id !== deleteTarget.id))
    setDeleteTarget(null)
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
      {travellers.length === 0 ? (
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
          if (!isOpen) setDeleteTarget(null)
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
