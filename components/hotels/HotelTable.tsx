"use client"

/**
 * HotelTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Hotel Booking module's container component — same architecture as
 * TravellerTable/VehicleTable/ExpenseTable/FuelTable: owns the shared list
 * state, search, a "Needs Booking" filter, view-mode toggle, and the
 * add/edit/delete flows. HotelCard and AddHotelDialog are both
 * presentational/controlled and take everything they need as props.
 *
 * No backend: `bookings` is local React state only, starting empty. This
 * is a booking *tracker* — it does not pre-load any hotel shortlist data;
 * that stays a separate static reference document.
 *
 * "City" is a Select rather than free text, unlike Vehicles' free-text
 * fields — the trip's route is a real, frozen, closed set of cities, so a
 * Select prevents typos that would silently break search and filtering.
 * "Other" is included as an escape valve.
 */

import * as React from "react"
import { addDays, format, isValid, parseISO } from "date-fns"

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
  BedDouble,
  type LucideIcon,
} from "lucide-react"

import { HotelCard } from "./HotelCard"
import { AddHotelDialog } from "./AddHotelDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type HotelCity =
  | "Raipur"
  | "Puri"
  | "Kharagpur"
  | "Muzaffarpur"
  | "Kathmandu"
  | "Pokhara"
  | "Prayagraj"
  | "Nagpur"
  | "Varanasi"
  | "Chitwan"
  | "Other"

export type HotelCurrency = "INR" | "NPR"

export type BookingStatus = "Not Booked" | "Booked" | "Confirmed"

export interface HotelBooking {
  id: string
  city: HotelCity
  hotelName: string
  /** ISO date string, e.g. "2026-08-01". */
  checkInDate: string
  nights: number | null
  rooms: number | null
  ratePerRoom: number | null
  currency: HotelCurrency
  parkingConfirmed: boolean
  freeCancellation: boolean
  status: BookingStatus
  contactPhone: string
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; booking: HotelBooking } | null

/** Kept local to each file that needs it (also duplicated in HotelCard)
 *  rather than exported, purely to avoid a value-level circular import
 *  between the sibling files for small pure functions. */
function statusBadgeVariant(status: BookingStatus): "default" | "secondary" | "destructive" {
  if (status === "Confirmed") return "default"
  if (status === "Booked") return "secondary"
  return "destructive" // Not Booked
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "—"
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "—"
}

/** Computed, not stored — derived from check-in date + nights so it can
 *  never drift out of sync with those two fields. */
function computeCheckoutDisplay(checkInIso: string, nights: number | null): string {
  if (!checkInIso || !nights || nights <= 0) return "—"
  const parsed = parseISO(checkInIso)
  if (!isValid(parsed)) return "—"
  return format(addDays(parsed, nights), "d MMM yyyy")
}

function formatAmount(amount: number, currency: HotelCurrency): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return `NPR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`
}

/** Total cost = rooms × rate × nights — only computable once all three
 *  are set; otherwise there isn't enough information yet. */
function computeTotalCost(booking: HotelBooking): number | null {
  if (!booking.rooms || !booking.ratePerRoom || !booking.nights) return null
  return booking.rooms * booking.ratePerRoom * booking.nights
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
  bookings: HotelBooking[]
  onEdit: (booking: HotelBooking) => void
  onDelete: (booking: HotelBooking) => void
}

function TableView({ bookings, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>City / Hotel</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const totalCost = computeTotalCost(booking)
            return (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium">{booking.city}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.hotelName || "No hotel selected"}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDisplayDate(booking.checkInDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {computeCheckoutDisplay(booking.checkInDate, booking.nights)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.rooms ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {totalCost !== null ? formatAmount(totalCost, booking.currency) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(booking.status)} className="whitespace-nowrap">
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit booking: ${booking.hotelName || booking.city}`}
                      onClick={() => onEdit(booking)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete booking: ${booking.hotelName || booking.city}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(booking)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 HotelTable                                */
/* -------------------------------------------------------------------------- */

export function HotelTable() {
  const [bookings, setBookings] = React.useState<HotelBooking[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [needsBookingOnly, setNeedsBookingOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<HotelBooking | null>(null)

  const filteredBookings = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return bookings.filter((booking) => {
      if (needsBookingOnly && booking.status !== "Not Booked") return false
      if (!query) return true
      return (
        booking.city.toLowerCase().includes(query) ||
        booking.hotelName.toLowerCase().includes(query)
      )
    })
  }, [bookings, searchQuery, needsBookingOnly])

  const notBookedCount = React.useMemo(
    () => bookings.filter((booking) => booking.status === "Not Booked").length,
    [bookings]
  )

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(booking: HotelBooking) {
    setDialogState({ mode: "edit", booking })
  }

  function handleDeleteClick(booking: HotelBooking) {
    setDeleteTarget(booking)
  }

  function handleDialogSubmit(booking: HotelBooking) {
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === booking.id)
      return exists
        ? prev.map((b) => (b.id === booking.id ? booking : b))
        : [...prev, booking]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Hotels</h2>
        <p className="text-sm text-muted-foreground">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"} · {notBookedCount} need
          {notBookedCount === 1 ? "s" : ""} booking
        </p>
      </div>

      {/* Toolbar: search, needs-booking filter, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city or hotel name…"
            className="pl-8"
            aria-label="Search hotel bookings"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={needsBookingOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={needsBookingOnly}
            onClick={() => setNeedsBookingOnly((prev) => !prev)}
          >
            <BedDouble className="h-4 w-4" aria-hidden="true" />
            Needs booking
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
            Add Booking
          </Button>
        </div>
      </div>

      {/* Content */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No hotel bookings yet"
          description="Track every city's hotel — parking confirmation and free-cancellation status live here too."
          actionLabel="Add Booking"
          onAction={handleAddClick}
        />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the Needs Booking filter."
        />
      ) : viewMode === "table" ? (
        <TableView
          bookings={filteredBookings}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBookings.map((booking) => (
            <HotelCard
              key={booking.id}
              booking={booking}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddHotelDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        booking={dialogState?.mode === "edit" ? dialogState.booking : null}
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
            <AlertDialogTitle>Remove this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.hotelName || deleteTarget.city} (${deleteTarget.city}) will be removed. This can't be undone from here.`
                : "This can't be undone from here."}
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
