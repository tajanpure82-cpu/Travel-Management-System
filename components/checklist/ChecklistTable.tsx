"use client"

/**
 * ChecklistTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Checklist module's container component — Firestore-backed,
 * following the pattern proven in TravellerTable/VehicleTable/etc.
 *
 * "Completed" can be toggled two ways: a quick click on the check icon
 * directly in Table/Card view, or via the Checkbox inside the Edit
 * dialog. The quick-toggle calls Firestore directly and only shows a
 * toast on failure — the checkmark flipping is already the confirmation,
 * so a success toast on every single check-off would be noise rather
 * than feedback. The dialog's full save still gets a toast either way,
 * matching every other module (the dialog closing needs that
 * confirmation since there's no other visual cue).
 */

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  ClipboardList,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from "lucide-react"

import { ChecklistCard } from "./ChecklistCard"
import { AddChecklistDialog } from "./AddChecklistDialog"
import { getErrorMessage } from "@/lib/firebase/errors"
import {
  addChecklistItem,
  deleteChecklistItem,
  subscribeToChecklistItems,
  updateChecklistItem,
} from "@/services/checklist/checklist.service"
import type { ChecklistItem, ChecklistPriority, NewChecklistItem } from "@/types/checklist"

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; item: ChecklistItem } | null

/** Kept local to each file that needs it (also duplicated in
 *  ChecklistCard) rather than exported, purely to avoid a value-level
 *  circular import between the sibling files for a small pure function. */
function priorityBadgeVariant(
  priority: ChecklistPriority
): "default" | "secondary" | "destructive" {
  if (priority === "High") return "destructive"
  if (priority === "Medium") return "secondary"
  return "default" // Low
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
  items: ChecklistItem[]
  onToggleComplete: (item: ChecklistItem) => void
  onEdit: (item: ChecklistItem) => void
  onDelete: (item: ChecklistItem) => void
}

function TableView({ items, onToggleComplete, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onToggleComplete(item)}
                  aria-pressed={item.completed}
                  aria-label={item.completed ? "Mark as not done" : "Mark as done"}
                  className="flex items-center justify-center rounded-md p-1 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              </TableCell>
              <TableCell
                className={
                  item.completed ? "text-muted-foreground line-through" : "font-medium"
                }
              >
                {item.title}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {item.category}
              </TableCell>
              <TableCell>
                <Badge variant={priorityBadgeVariant(item.priority)}>{item.priority}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${item.title}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(item)}
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
/*                               ChecklistTable                              */
/* -------------------------------------------------------------------------- */

export function ChecklistTable() {
  const [items, setItems] = React.useState<ChecklistItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [pendingOnly, setPendingOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ChecklistItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Real-time Firestore subscription — fires immediately with the current
  // data, then again on every add/edit/delete from any browser/device.
  React.useEffect(() => {
    const unsubscribe = subscribeToChecklistItems(
      (data) => {
        setItems(data)
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const filteredItems = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      if (pendingOnly && item.completed) return false
      if (!query) return true
      return (
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
    })
  }, [items, searchQuery, pendingOnly])

  const completedCount = React.useMemo(
    () => items.filter((item) => item.completed).length,
    [items]
  )

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(item: ChecklistItem) {
    setDialogState({ mode: "edit", item })
  }

  function handleDeleteClick(item: ChecklistItem) {
    setDeleteTarget(item)
  }

  // Quick toggle — bypasses the dialog entirely. Only errors get a toast;
  // the checkmark itself is the success confirmation.
  async function handleToggleComplete(item: ChecklistItem) {
    try {
      await updateChecklistItem(item.id, { completed: !item.completed })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleDialogSubmit(data: NewChecklistItem, id?: string) {
    try {
      if (id) {
        await updateChecklistItem(id, data)
        toast.success("Item updated")
      } else {
        await addChecklistItem(data)
        toast.success("Item added")
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
      await deleteChecklistItem(deleteTarget.id)
      toast.success("Item deleted")
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
        <h2 className="text-lg font-semibold tracking-tight">Checklist</h2>
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} · {completedCount} completed
        </p>
      </div>

      {/* Toolbar: search, pending-only filter, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or category…"
            className="pl-8"
            aria-label="Search checklist items"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={pendingOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={pendingOnly}
            onClick={() => setPendingOnly((prev) => !prev)}
          >
            <Circle className="h-4 w-4" aria-hidden="true" />
            Pending only
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
            Add Item
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No checklist items yet"
          description="Track pre-trip prep, packing, documents, and daily tasks — check them off as you go."
          actionLabel="Add Item"
          onAction={handleAddClick}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the Pending-only filter."
        />
      ) : viewMode === "table" ? (
        <TableView
          items={filteredItems}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddChecklistDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        item={dialogState?.mode === "edit" ? dialogState.item : null}
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
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title}" will be removed. This can't be undone from here.`
                : "This can't be undone from here."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
