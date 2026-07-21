"use client"

/**
 * TimelineTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Trip Timeline module's container component — same architecture as
 * TravellerTable/VehicleTable/etc: owns the shared list state, search, a
 * "Hide completed" filter, view-mode toggle, and the add/edit/delete
 * flows. TimelineCard and AddTimelineDialog are both presentational/
 * controlled and take everything they need as props.
 *
 * No backend: `entries` is local React state only, starting empty. Not
 * wired to Context yet — per current instructions, this module stays on
 * plain local state until the Dashboard integration work resumes.
 *
 * Entries are always displayed sorted by day number ascending (entries
 * with no day set sort last) — a timeline should read chronologically,
 * not in whatever order things were added, unlike every other module
 * here where insertion order is fine.
 */

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"

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
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react"

import { TimelineCard } from "./TimelineCard"
import { AddTimelineDialog } from "./AddTimelineDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type TimelineStatus = "Upcoming" | "In Progress" | "Completed"

export interface TimelineEntry {
  id: string
  /** Day 1–11 (or whatever numbering fits), or null if not tied to a day. */
  day: number | null
  /** ISO date string, or null if not yet known. */
  date: string | null
  title: string
  distanceKm: number | null
  status: TimelineStatus
  notes: string
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; entry: TimelineEntry } | null

/** Kept local to each file that needs it (also duplicated in
 *  TimelineCard) rather than exported, purely to avoid a value-level
 *  circular import between the sibling files for small pure functions. */
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

/** Ascending by day, entries with no day set sort to the end. */
function sortByDay(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.day === null && b.day === null) return 0
    if (a.day === null) return 1
    if (b.day === null) return -1
    return a.day - b.day
  })
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
  entries: TimelineEntry[]
  onEdit: (entry: TimelineEntry) => void
  onDelete: (entry: TimelineEntry) => void
}

function TableView({ entries, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortByDay(entries).map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {entry.day !== null ? `Day ${entry.day}` : "—"}
              </TableCell>
              <TableCell className="font-medium">{entry.title || "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDisplayDate(entry.date)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {entry.distanceKm !== null ? `${entry.distanceKm} km` : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(entry.status)} className="whitespace-nowrap">
                  {entry.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${entry.title}`}
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${entry.title}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(entry)}
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
/*                               TimelineTable                               */
/* -------------------------------------------------------------------------- */

export function TimelineTable() {
  const [entries, setEntries] = React.useState<TimelineEntry[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [hideCompleted, setHideCompleted] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<TimelineEntry | null>(null)

  const filteredEntries = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return entries.filter((entry) => {
      if (hideCompleted && entry.status === "Completed") return false
      if (!query) return true
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.notes.toLowerCase().includes(query)
      )
    })
  }, [entries, searchQuery, hideCompleted])

  const completedCount = React.useMemo(
    () => entries.filter((entry) => entry.status === "Completed").length,
    [entries]
  )

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(entry: TimelineEntry) {
    setDialogState({ mode: "edit", entry })
  }

  function handleDeleteClick(entry: TimelineEntry) {
    setDeleteTarget(entry)
  }

  function handleDialogSubmit(entry: TimelineEntry) {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id)
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Trip Timeline</h2>
        <p className="text-sm text-muted-foreground">
          {entries.length} leg{entries.length === 1 ? "" : "s"} · {completedCount} completed
        </p>
      </div>

      {/* Toolbar: search, hide-completed filter, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or notes…"
            className="pl-8"
            aria-label="Search timeline entries"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={hideCompleted ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={hideCompleted}
            onClick={() => setHideCompleted((prev) => !prev)}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            Hide completed
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
            Add Leg
          </Button>
        </div>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="No timeline entries yet"
          description="Build out the trip day by day — route, distance, and status all live here."
          actionLabel="Add Leg"
          onAction={handleAddClick}
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the Hide-completed filter."
        />
      ) : viewMode === "table" ? (
        <TableView
          entries={filteredEntries}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortByDay(filteredEntries).map((entry) => (
            <TimelineCard
              key={entry.id}
              entry={entry}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddTimelineDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        entry={dialogState?.mode === "edit" ? dialogState.entry : null}
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
            <AlertDialogTitle>Delete this leg?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title}" will be removed. This can't be undone from here.`
                : "This can't be undone from here."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
