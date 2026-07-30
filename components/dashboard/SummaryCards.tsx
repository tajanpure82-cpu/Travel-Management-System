"use client"

/**
 * SummaryCards
 * ─────────────────────────────────────────────────────────────────────────
 * Dashboard summary — one live card per module/metric, reading real
 * Firestore data via useLiveCollection (10 modules) plus a direct
 * subscription for Settings (a singleton document, not a collection).
 *
 * Four cards added in this pass, per the Analytics request: Total Budget,
 * Hotel Cost, Food Cost, Trip Progress. Fuel Cost, Toll Cost, and
 * Remaining Budget already existed from the original build. Driver
 * Rotation is deliberately not here — it needs a real new data concept
 * (which driver drives which day), not just a computed card, and wasn't
 * built alongside this pass.
 *
 * Hotel Cost and Food Cost reuse the exact same dual-currency
 * non-blending discipline as every other total in this app — INR and NPR
 * are never combined at a guessed rate.
 *
 * Error handling is quieter here than everywhere else in this app,
 * deliberately: every module's own page shows a toast on a Firestore
 * error because the user is actively there, doing something. Dashboard is
 * a passive summary — if one of eleven collections briefly fails to
 * load, showing "—" for just that card is better UX than firing a toast
 * (or eleven) the moment the page opens.
 */

import * as React from "react"
import { differenceInCalendarDays, isValid, parseISO } from "date-fns"
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
  Landmark,
  UtensilsCrossed,
  CalendarClock,
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

/** Total cost = rooms × rate × nights — only computable once all three
 *  are set; otherwise there isn't enough information yet. Duplicated
 *  from HotelTable.tsx's own helper, matching this codebase's convention
 *  of duplicating small pure functions per file rather than sharing one. */
function computeHotelTotalCost(booking: HotelBooking): number | null {
  if (!booking.rooms || !booking.ratePerRoom || !booking.nights) return null
  return booking.rooms * booking.ratePerRoom * booking.nights
}

interface TripProgress {
  label: string
  helpText: string
}

/** Computes "Day X of Y" from Settings' start/end dates and today's real
 *  date. Returns null if either date is missing or invalid — Trip
 *  Progress simply doesn't render a card in that case, rather than
 *  showing a misleading "Day 0". */
function computeTripProgress(startDateIso: string, endDateIso: string): TripProgress | null {
  if (!startDateIso || !endDateIso) return null
  const start = parseISO(startDateIso)
  const end = parseISO(endDateIso)
  if (!isValid(start) || !isValid(end)) return null

  const today = new Date()
  const totalDays = differenceInCalendarDays(end, start) + 1
  const daysSinceStart = differenceInCalendarDays(today, start)

  if (totalDays <= 0) return null

  if (daysSinceStart < 0) {
    const daysUntil = -daysSinceStart
    return {
      label: "Not started",
      helpText: `Starts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
    }
  }

  if (daysSinceStart >= totalDays) {
    return { label: "Completed", helpText: "Trip has ended" }
  }

  const currentDay = daysSinceStart + 1
  const daysRemaining = totalDays - currentDay
  return {
    label: `Day ${currentDay} of ${totalDays}`,
    helpText:
      daysRemaining === 0 ? "Last day" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`,
  }
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
        // if it fails, Remaining Budget and Total Budget silently can't
        // be computed, and that's worth knowing about rather than just
        // seeing a dash.
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
        if (expense.splitType !== "Shared") return totals
        if (expense.currency === "INR") totals.inr += expense.amount
        else totals.npr += expense.amount
        return totals
      },
      { inr: 0, npr: 0 }
    )
  }, [expenses.data])

  // Food Cost — every Food-category expense counts, Shared or Personal,
  // since this is a category rollup, not a settlement figure. Unlike
  // Kitty Spend (which deliberately excludes Personal), "how much has the
  // group spent on food in total" should include everyone's food
  // purchases, whoever ends up paying whom back for them.
  const foodTotals = React.useMemo(() => {
    return expenses.data.reduce(
      (totals, expense) => {
        if (expense.category !== "Food") return totals
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
    () => tolls.data.reduce((sum, entry) => sum + entry.amount, 0),
    [tolls.data]
  )

  // Hotel Cost — sums each booking's total (rooms × rate × nights),
  // split by currency, skipping any booking that doesn't have enough
  // information yet to compute a total.
  const hotelCostTotals = React.useMemo(() => {
    return hotelBookings.data.reduce(
      (totals, booking) => {
        const cost = computeHotelTotalCost(booking)
        if (cost === null) return totals
        if (booking.currency === "INR") totals.inr += cost
        else totals.npr += cost
        return totals
      },
      { inr: 0, npr: 0 }
    )
  }, [hotelBookings.data])

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

  const tripProgress = React.useMemo(() => {
    if (!settings) return null
    return computeTripProgress(settings.startDate, settings.endDate)
  }, [settings])

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
        loading={settingsLoading}
        icon={Landmark}
        label="Total Budget"
        value={
          settings?.totalBudgetCollected !== null && settings?.totalBudgetCollected !== undefined
            ? formatInr(settings.totalBudgetCollected)
            : "—"
        }
        helpText={
          settings?.totalBudgetCollected !== null && settings?.totalBudgetCollected !== undefined
            ? "Collected upfront"
            : "Set in Settings"
        }
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
        loading={expenses.loading}
        icon={UtensilsCrossed}
        label="Food Cost"
        value={expenses.error ? "—" : formatDualCurrency(foodTotals.inr, foodTotals.npr)}
        helpText={expenses.error ? "Couldn't load" : "All food purchases, shared or personal"}
      />

      <StatCard
        loading={fuelEntries.loading}
        icon={FuelIcon}
        label="Fuel Cost"
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
        label="Toll Cost"
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
        label="Hotel Cost"
        value={
          hotelBookings.error
            ? "—"
            : formatDualCurrency(hotelCostTotals.inr, hotelCostTotals.npr)
        }
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
        loading={settingsLoading}
        icon={CalendarClock}
        label="Trip Progress"
        value={tripProgress?.label ?? "—"}
        helpText={tripProgress?.helpText ?? "Set start/end dates in Settings"}
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
