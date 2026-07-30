"use client"

/**
 * TollCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single toll entry — used by TollTable's Card
 * View. Shows `vehicleName` (the real Vehicle reference's display name)
 * and a single amount, replacing the old Car A / Car B split.
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
import { Pencil, Trash2, Calendar, Car } from "lucide-react"

import type { TollEntry } from "@/types/toll"

interface TollCardProps {
  entry: TollEntry
  onEdit: (entry: TollEntry) => void
  onDelete: (entry: TollEntry) => void
}

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

export function TollCard({ entry, onEdit, onDelete }: TollCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {entry.section || "Untitled section"}
            </CardTitle>
            <CardDescription className="text-lg font-semibold text-foreground">
              {formatInr(entry.amount)}
            </CardDescription>
          </div>
          <Badge variant={entry.method === "FASTag" ? "default" : "outline"} className="shrink-0">
            {entry.method}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formatDisplayDate(entry.date)}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Car className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{entry.vehicleName || "Unassigned vehicle"}</span>
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
