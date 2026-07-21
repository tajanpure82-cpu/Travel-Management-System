"use client"

/**
 * FuelCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single fuel entry — used by FuelTable's Card
 * View.
 */

import { format, isValid, parseISO } from "date-fns"

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
import { Pencil, Trash2, Calendar, MapPin, Gauge } from "lucide-react"

import type { FuelEntry, FuelCurrency } from "./FuelTable"

interface FuelCardProps {
  entry: FuelEntry
  onEdit: (entry: FuelEntry) => void
  onDelete: (entry: FuelEntry) => void
}

/** Kept local rather than imported — see the note in FuelTable's TableView
 *  about avoiding a value-level circular import for small helpers. */
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

function ratePerLitre(entry: FuelEntry): string {
  if (entry.litres <= 0) return "—"
  return `${formatAmount(entry.amount / entry.litres, entry.currency)}/L`
}

export function FuelCard({ entry, onEdit, onDelete }: FuelCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {entry.vehicle || "Unassigned vehicle"}
            </CardTitle>
            <CardDescription className="text-lg font-semibold text-foreground">
              {formatAmount(entry.amount, entry.currency)}
            </CardDescription>
          </div>
          {entry.fullTank ? (
            <Badge variant="default" className="shrink-0">
              Full Tank
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              Partial
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formatDisplayDate(entry.date)}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{entry.location || "No location on file"}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {entry.litres} L · {ratePerLitre(entry)}
            {entry.odometer !== null ? ` · ${entry.odometer} km odometer` : ""}
          </span>
        </div>

        {entry.notes && (
          <>
            <Separator />
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              {entry.notes}
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
          onClick={() => onEdit(entry)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(entry)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
