"use client"

/**
 * SummaryCards
 * ─────────────────────────────────────────────────────────────────────────
 * Dashboard summary — one live card per module, reading real Firestore
 * data via useLiveCollection (10 modules) plus a direct subscription for
 * Settings (a singleton document, not a collection — see that section
 * below for why it can't use the same hook).
 *
 * Two adaptations from the original plan's example card list, both
 * disclosed in the Phase 3 write-up:
 *   - "Remaining Budget" needed a new `totalBudgetCollected` field on
 *     Settings — nothing in the schema held a total-budget figure before.
 *   - "Today's Checklist" became "Checklist Progress" — ChecklistItem has
 *     no due-date concept, so a literal "today" framing doesn't exist in
 *     the real data; this shows completed/total instead.
 *
 * Error handling is quieter here than everywhere else in this app,
 * deliberately: every module's own page shows a toast on a Firestore
 * error because the user is actively there, doing something. Dashboard is
 * a passive summary — if one of eleven collections briefly fails to
 * load, showing "—" for just that card is better UX than firing a toast
 * (or eleven) the moment the page opens.
 */

import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Car,
  Wallet,
  PiggyBank,
  Fuel as FuelIcon,
  Route as RouteIcon,
  BedDouble,
  FolderOpen,
  ClipboardList,
  Map as MapIcon,
  Siren,
  type LucideIcon,
} from "lucide-react"

import { useLiveCollection } from "@/hooks/useLiveCollection"
import { getErrorMessage } from "@/lib/firebase/errors"

import { subscribeToTravellers } from "@/services/travellers/travellers.service"
import { subscribeToVehicles } from "@/services/vehicles/vehicles.service"
import { subscribeToExpenses } from "@/services/expenses/expenses.service"
import { subscribeToFuelEntries } from "@/services/fuel/fuel.service"
import { subscribeToTolls } from "@/services/tolls/tolls.service"
import { subscribeToHotelBookings } from "@/services/hotels/hotels.service"
import { subscribeToDocumentRecords } from "@/services/documents/documents.service"
import { subscribeToChecklistItems } from "@/services/checklist/checklist.service"
import { subscribeToEmergencyContacts } from "@/services/emergency/emergency.service"
import { subscribeToTimelineEntries } from "@/services/timeline/timeline.service"
import { subscribeToTripSettings } from "@/services/settings/settings.service"

import type { Traveller } from "@/types/traveller"
import type { Vehicle } from "@/types/vehicle"
import type { Expense } from "@/types/expense"
import type { FuelEntry } from "@/types/fuel"
import type { TollEntry } from "@/types/toll"
import type { HotelBooking } from "@/types/hotel"
import type { DocumentRecord } from "@/types/document"
import type { ChecklistItem } from "@/types/checklist"
import type { EmergencyContact } from "@/types/emergency"
import type { TimelineEntry } from "@/types/timeline"
import type { TripSettings } from "@/types/settings"

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNpr(amount: number): string {
  return `NPR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`
}

/** `₹X` alone if there's no NPR component, `₹X + NPR Y` if there is —
 *  same non-blending discipline every module's own currency total uses:
 *  converting NPR to INR at a hardcoded rate would be a real accuracy
 *  risk, not just a display simplification. */
function formatDualCurrency(inr: number, npr: number): string {
  return npr > 0 ? `${formatInr(inr)} + ${formatNpr(npr)}` : formatInr(inr)
}

/* -------------------------------------------------------------------------- */
/*                                 Stat card                                 */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  helpText: string
  accentClassName?: string
  loading?: boolean
}

function StatCard({ icon: Icon, label, value, helpText, accentClassName, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="truncate text-2xl font-bold tracking-tight">{value}</p>
            <p className="truncate text-xs text-muted-foreground">{helpText}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              accentClassName ?? "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*                                SummaryCards                               */
/* -------------------------------------------------------------------------- */

export function SummaryCards() {
  const travellers = useLiveCollection<Traveller>(subscribeToTravellers)
  const vehicles = useLiveCollection<Vehicle>(subscribeToVehicles)
  const expenses = useLiveCollection<Expense>(subscribeToExpenses)
  const fuelEntries = useLiveCollection<FuelEntry>(subscribeToFuelEntries)
  const tolls = useLiveCollection<TollEntry>(subscribeToTolls)
  const hotelBookings = useLiveCollection<HotelBooking>(subscribeToHotelBookings)
  const documents = useLiveCollection<DocumentRecord>(subscribeToDocumentRecords)
  const checklistItems = useLiveCollection<ChecklistItem>(subscribeToChecklistItems)
  const emergencyContacts = useLiveCollection<EmergencyContact>(subscribeToEmergencyContacts)
  const timelineEntries = useLiveCollection<TimelineEntry>(subscribeToTimelineEntries)

  // Settings is a singleton document, not a collection — useLiveCollection
  // is typed around subscribeToCollection-shaped functions that return an
  // array, so it doesn't fit here. Same quiet-degrade error handling as
  // every other card on this page, just wired directly instead of through
  // the shared hook.
  const [settings, setSettings] = React.useState<TripSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = subscribeToTripSettings(
      (data) => {
        setSettings(data)
        setSettingsLoading(false)
      },
      (error) => {
        // Settings genuinely is worth a toast even on this passive page —
        // if it fails, Remaining Budget silently can't be computed, and
        // that's worth knowing about rather than just seeing a dash.
        toast.error(getErrorMessage(error))
        setSettingsLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const driverCount = React.useMemo(
    () => travellers.data.filter((t) => t.isDriver).length,
    [travellers.data]
  )

  const availableVehicleCount = React.useMemo(
    () => vehicles.data.filter((v) => v.status === "Available").length,
    [vehicles.data]
  )

  const kittyTotals = React.useMemo(() => {
    return expenses.data.reduce(
      (totals, expense) => {
        if (expense.split !== "Kitty") return totals
        if (expense.currency === "INR") totals.inr += expense.amount
        else totals.npr += expense.amount
        return totals
      },
      { inr: 0, npr: 0 }
    )
  }, [expenses.data])

  const fuelTotals = React.useMemo(() => {
    return fuelEntries.data.reduce(
      (totals, entry) => {
        totals.litres += entry.litres
        if (entry.currency === "INR") totals.inr += entry.amount
        else totals.npr += entry.amount
        return totals
      },
      { litres: 0, inr: 0, npr: 0 }
    )
  }, [fuelEntries.data])

  const tollTotal = React.useMemo(
    () => tolls.data.reduce((sum, entry) => sum + entry.carAAmount + entry.carBAmount, 0),
    [tolls.data]
  )

  const hotelsNotBookedCount = React.useMemo(
    () => hotelBookings.data.filter((b) => b.status === "Not Booked").length,
    [hotelBookings.data]
  )

  const documentsAttentionCount = React.useMemo(
    () => documents.data.filter((d) => d.status !== "Valid").length,
    [documents.data]
  )

  const checklistCompletedCount = React.useMemo(
    () => checklistItems.data.filter((item) => item.completed).length,
    [checklistItems.data]
  )

  const timelineCompletedCount = React.useMemo(
    () => timelineEntries.data.filter((entry) => entry.status === "Completed").length,
    [timelineEntries.data]
  )

  const remainingBudget = React.useMemo(() => {
    if (!settings || settings.totalBudgetCollected === null) return null
    return settings.totalBudgetCollected - kittyTotals.inr
  }, [settings, kittyTotals.inr])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        loading={travellers.loading}
        icon={Users}
        label="Travellers"
        value={travellers.error ? "—" : `${travellers.data.length}`}
        helpText={
          travellers.error
            ? "Couldn't load"
            : `${driverCount} driver${driverCount === 1 ? "" : "s"}`
        }
        accentClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />

      <StatCard
        loading={vehicles.loading}
        icon={Car}
        label="Vehicles"
        value={vehicles.error ? "—" : `${vehicles.data.length}`}
        helpText={
          vehicles.error ? "Couldn't load" : `${availableVehicleCount} available`
        }
        accentClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />

      <StatCard
        loading={expenses.loading}
        icon={Wallet}
        label="Group Expenses"
        value={expenses.error ? "—" : formatDualCurrency(kittyTotals.inr, kittyTotals.npr)}
        helpText={
          expenses.error
            ? "Couldn't load"
            : `${expenses.data.length} expense${expenses.data.length === 1 ? "" : "s"} logged`
        }
        accentClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />

      <StatCard
        loading={settingsLoading || expenses.loading}
        icon={PiggyBank}
        label="Remaining Budget"
        value={remainingBudget !== null ? formatInr(remainingBudget) : "—"}
        helpText={
          remainingBudget !== null
            ? `of ${formatInr(settings?.totalBudgetCollected ?? 0)} collected`
            : "Set total budget in Settings"
        }
      />

      <StatCard
        loading={fuelEntries.loading}
        icon={FuelIcon}
        label="Fuel"
        value={fuelEntries.error ? "—" : `${fuelTotals.litres}L`}
        helpText={
          fuelEntries.error
            ? "Couldn't load"
            : formatDualCurrency(fuelTotals.inr, fuelTotals.npr)
        }
      />

      <StatCard
        loading={tolls.loading}
        icon={RouteIcon}
        label="Tolls"
        value={tolls.error ? "—" : formatInr(tollTotal)}
        helpText={
          tolls.error
            ? "Couldn't load"
            : `${tolls.data.length} entr${tolls.data.length === 1 ? "y" : "ies"}`
        }
      />

      <StatCard
        loading={hotelBookings.loading}
        icon={BedDouble}
        label="Hotels"
        value={hotelBookings.error ? "—" : `${hotelBookings.data.length}`}
        helpText={
          hotelBookings.error
            ? "Couldn't load"
            : `${hotelsNotBookedCount} need${hotelsNotBookedCount === 1 ? "s" : ""} booking`
        }
      />

      <StatCard
        loading={documents.loading}
        icon={FolderOpen}
        label="Documents"
        value={documents.error ? "—" : `${documents.data.length}`}
        helpText={
          documents.error
            ? "Couldn't load"
            : `${documentsAttentionCount} need${documentsAttentionCount === 1 ? "s" : ""} attention`
        }
      />

      <StatCard
        loading={checklistItems.loading}
        icon={ClipboardList}
        label="Checklist Progress"
        value={
          checklistItems.error
            ? "—"
            : `${checklistCompletedCount}/${checklistItems.data.length}`
        }
        helpText={checklistItems.error ? "Couldn't load" : "items completed"}
      />

      <StatCard
        loading={timelineEntries.loading}
        icon={MapIcon}
        label="Timeline Progress"
        value={
          timelineEntries.error
            ? "—"
            : `${timelineCompletedCount}/${timelineEntries.data.length}`
        }
        helpText={timelineEntries.error ? "Couldn't load" : "legs completed"}
      />

      <StatCard
        loading={emergencyContacts.loading}
        icon={Siren}
        label="Emergency Contacts"
        value={emergencyContacts.error ? "—" : `${emergencyContacts.data.length}`}
        helpText={emergencyContacts.error ? "Couldn't load" : "saved"}
      />
    </div>
  )
}
