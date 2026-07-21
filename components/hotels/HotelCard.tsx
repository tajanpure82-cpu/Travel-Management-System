"use client"

/**
 * HotelCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single hotel booking — used by HotelTable's
 * Card View.
 */

import { addDays, format, isValid, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Pencil, Trash2, Calendar, Users, Car, ShieldCheck, Phone } from "lucide-react"

import type { HotelBooking, BookingStatus, HotelCurrency } from "./HotelTable"

interface HotelCardProps {
  booking: HotelBooking
  onEdit: (booking: HotelBooking) => void
  onDelete: (booking: HotelBooking) => void
}

/** Kept local rather than imported — see the note in HotelTable's
 *  TableView about avoiding a value-level circular import for small
 *  helpers. */
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

function computeTotalCost(booking: HotelBooking): number | null {
  if (!booking.rooms || !booking.ratePerRoom || !booking.nights) return null
  return booking.rooms * booking.ratePerRoom * booking.nights
}

export function HotelCard({ booking, onEdit, onDelete }: HotelCardProps) {
  const totalCost = computeTotalCost(booking)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {booking.hotelName || "No hotel selected"}
            </CardTitle>
            <CardDescription className="truncate">{booking.city}</CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(booking.status)} className="shrink-0">
            {booking.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {formatDisplayDate(booking.checkInDate)} →{" "}
            {computeCheckoutDisplay(booking.checkInDate, booking.nights)}
            {booking.nights ? ` (${booking.nights} night${booking.nights === 1 ? "" : "s"})` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {booking.rooms ?? "—"} room{booking.rooms === 1 ? "" : "s"}
            {totalCost !== null ? ` · ${formatAmount(totalCost, booking.currency)} total` : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={booking.parkingConfirmed ? "default" : "outline"} className="gap-1">
            <Car className="h-3 w-3" aria-hidden="true" />
            {booking.parkingConfirmed ? "Parking confirmed" : "Parking unconfirmed"}
          </Badge>
          <Badge variant={booking.freeCancellation ? "default" : "outline"} className="gap-1">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {booking.freeCancellation ? "Free cancellation" : "No free cancellation"}
          </Badge>
        </div>

        {booking.contactPhone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{booking.contactPhone}</span>
          </div>
        )}

        {booking.notes && (
          <>
            <Separator />
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              {booking.notes}
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onEdit(booking)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(booking)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
