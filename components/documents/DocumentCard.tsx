"use client"

/**
 * DocumentCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single document record — used by
 * DocumentTable's Card View.
 *
 * Naming note: the entry is called `record` (not `document`) throughout,
 * to avoid shadowing the global `window.document` object. Only the type
 * import changed for the Firestore migration (now from @/types/document
 * instead of sideways from ./DocumentTable).
 */

import { format, isValid, parseISO } from "date-fns"

import { cn } from "@/lib/utils"
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
import { Pencil, Trash2, Calendar, User, FileText, AlertTriangle } from "lucide-react"

import type { DocumentRecord, DocumentStatus } from "@/types/document"

interface DocumentCardProps {
  record: DocumentRecord
  onEdit: (record: DocumentRecord) => void
  onDelete: (record: DocumentRecord) => void
}

/** Kept local rather than imported — see the note in DocumentTable's
 *  TableView about avoiding a value-level circular import for small
 *  helpers. */
function statusBadgeVariant(
  status: DocumentStatus
): "default" | "secondary" | "destructive" {
  if (status === "Valid") return "default"
  if (status === "Expiring Soon") return "secondary"
  return "destructive" // Expired or Missing
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "No expiry"
  const parsed = parseISO(iso)
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : "No expiry"
}

function needsAttention(status: DocumentStatus): boolean {
  return status !== "Valid"
}

export function DocumentCard({ record, onEdit, onDelete }: DocumentCardProps) {
  const flagged = needsAttention(record.status)

  return (
    <Card className={cn("flex flex-col", flagged && "border-l-4 border-l-destructive")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{record.name || "Untitled"}</CardTitle>
            <CardDescription className="truncate">{record.category}</CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(record.status)} className="shrink-0">
            {record.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{record.ownerOrVehicle || "Unassigned"}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formatDisplayDate(record.expiryDate)}</span>
        </div>

        {record.fileReference && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{record.fileReference}</span>
          </div>
        )}

        {record.notes && (
          <>
            <Separator />
            <div
              className={cn(
                "flex items-start gap-2 rounded-md p-2 text-xs",
                flagged
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              {flagged && <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>{record.notes}</span>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onEdit(record)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(record)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
