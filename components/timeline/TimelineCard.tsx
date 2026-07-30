"use client"

/**
 * TimelineCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single timeline entry — used by
 * TimelineTable's Card View. Edit/Delete footer is print:hidden.
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
import { Pencil, Trash2, Calendar, Route } from "lucide-react"

import type { TimelineEntry, TimelineStatus } from "@/types/timeline"

interface TimelineCardProps {
  entry: TimelineEntry
  onEdit: (entry: TimelineEntry) => void
  onDelete: (entry: TimelineEntry) => void
}

function statusBadgeVariant(
  status: TimelineStatus
): "default" | "secondary" | "outline" {
  if (status === "Completed") return "default"
  if (status === "In Progress") return "secondary"
  return "outline" // Upcoming
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "No date set"
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "No date set"
}

export function TimelineCard({ entry, onEdit, onDelete }: TimelineCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{entry.title || "Untitled"}</CardTitle>
            <CardDescription>
              {entry.day !== null ? `Day ${entry.day}` : "No day set"}
            </CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(entry.status)} className="shrink-0">
            {entry.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formatDisplayDate(entry.date)}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Route className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {entry.distanceKm !== null ? `${entry.distanceKm} km` : "Distance not set"}
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

      <CardFooter className="gap-2 print:hidden">
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
