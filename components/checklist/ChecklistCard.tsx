"use client"

/**
 * ChecklistCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single checklist item — used by
 * ChecklistTable's Card View. Includes the same quick complete-toggle as
 * the Table View. Only the type import changed for the Firestore
 * migration (now from @/types/checklist instead of sideways from
 * ./ChecklistTable) — the toggle itself is still just a callback prop,
 * this component has no idea Firestore exists.
 */

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
import { Pencil, Trash2, CheckCircle2, Circle } from "lucide-react"

import type { ChecklistItem, ChecklistPriority } from "@/types/checklist"

interface ChecklistCardProps {
  item: ChecklistItem
  onToggleComplete: (item: ChecklistItem) => void
  onEdit: (item: ChecklistItem) => void
  onDelete: (item: ChecklistItem) => void
}

/** Kept local rather than imported — see the note in ChecklistTable's
 *  TableView about avoiding a value-level circular import for a small
 *  helper. */
function priorityBadgeVariant(
  priority: ChecklistPriority
): "default" | "secondary" | "destructive" {
  if (priority === "High") return "destructive"
  if (priority === "Medium") return "secondary"
  return "default" // Low
}

export function ChecklistCard({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
}: ChecklistCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onToggleComplete(item)}
            aria-pressed={item.completed}
            aria-label={item.completed ? "Mark as not done" : "Mark as done"}
            className="mt-0.5 flex shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <CardTitle
              className={cn(
                "truncate text-base",
                item.completed && "text-muted-foreground line-through"
              )}
            >
              {item.title}
            </CardTitle>
            <CardDescription className="truncate">{item.category}</CardDescription>
          </div>

          <Badge variant={priorityBadgeVariant(item.priority)} className="shrink-0">
            {item.priority}
          </Badge>
        </div>
      </CardHeader>

      {item.notes && (
        <CardContent className="flex-1">
          <Separator className="mb-3" />
          <p className="text-xs text-muted-foreground">{item.notes}</p>
        </CardContent>
      )}

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
