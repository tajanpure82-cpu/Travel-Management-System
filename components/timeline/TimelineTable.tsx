"use client"

/**
 * TimelineTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Trip Timeline module's container component — Firestore-backed.
 * Print added earlier: a printed itinerary is a reasonable backup to
 * have on paper. Search, filter, view toggle, and Edit/Delete are
 * print:hidden.
 *
 * Route Map (new): plots any leg that has a location set (see
 * AddTimelineDialog.tsx and lib/routeCities.ts) using free
 * OpenStreetMap tiles — no Google Maps, no API key, no billing account.
 * Imported via next/dynamic with ssr:false, since Leaflet needs the
 * browser's `window`/DOM, which doesn't exist during Next.js's
 * server-render pass. print:hidden — an interactive map has no place on
 * a printed itinerary; the Table/Card views below it are what print.
 *
 * Entries are always displayed sorted by day number ascending (entries
 * with no day set sort last) — computed client-side via `sortByDay`,
 * unchanged from before. No orderByField is passed to the Firestore
 * subscription — see services/timeline/timeline.service.ts for why.
 */

import * as React from "react"
import dynamic from "next/dynamic"
import { format, isValid, parseISO } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PrintButton } from "@/components/ui/print-button"
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
import { getErrorMessage } from "@/lib/firebase/errors"
import {
  addTimelineEntry,
  deleteTimelineEntry,
  subscribeToTimelineEntries,
  updateTimelineEntry,
} from "@/services/timeline/timeline.service"
import type { NewTimelineEntry, TimelineEntry, TimelineStatus } from "@/types/timeline"

// ssr:false is required here, not optional — Leaflet references
// `window`/the DOM at module load time, which doesn't exist during
// Next.js's server-side render pass and would crash the build otherwise.
const RouteMap = dynamic(
  () => import("./RouteMap").then((mod) => mod.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
)

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; entry: TimelineEntry } | null

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
            <TableHead className="text-right print:hidden">Actions</TableHead>
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
              <TableCell className="text-right print:hidden">
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
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [hideCompleted, setHideCompleted] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<TimelineEntry | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Real-time Firestore subscription — no orderByField here, see the
  // service file for why.
  React.useEffect(() => {
    const unsubscribe = subscribeToTimelineEntries(
      (data) => {
        setEntries(data)
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

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

  async function handleDialogSubmit(data: NewTimelineEntry, id?: string) {
    try {
      if (id) {
        await updateTimelineEntry(id, data)
        toast.success("Leg updated")
      } else {
        await addTimelineEntry(data)
        toast.success("Leg added")
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
      await deleteTimelineEntry(deleteTarget.id)
      toast.success("Leg deleted")
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
        <h2 className="text-lg font-semibold tracking-tight">Trip Timeline</h2>
        <p className="text-sm text-muted-foreground">
          {entries.length} leg{entries.length === 1 ? "" : "s"} · {completedCount} completed
        </p>
      </div>

      {/* Route Map — plots any leg with a location set. Hidden entirely
          from print; the tables/cards below are what print. */}
      {!loading && (
        <div className="print:hidden">
          <RouteMap entries={entries} />
        </div>
      )}

      {/* Toolbar: search, hide-completed filter, view toggle, print, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
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

          <PrintButton />

          <Button type="button" size="sm" className="gap-1.5" onClick={handleAddClick}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Leg
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : entries.length === 0 ? (
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
          if (!isOpen && !isDeleting) setDeleteTarget(null)
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
