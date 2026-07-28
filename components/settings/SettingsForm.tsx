"use client"

/**
 * SettingsForm
 * ─────────────────────────────────────────────────────────────────────────
 * Settings is a deliberate architectural exception in this codebase: a
 * singleton form for trip-wide values, not a list-based CRUD module. No
 * SettingsTable, SettingsCard, or AddSettingsDialog — just this one form
 * component, matching this project's own established convention.
 *
 * Firestore migration: reads/writes a single fixed document (settings/
 * trip) via subscribeToTripSettings / saveTripSettings, not a collection.
 *
 * Concurrent-edit handling: the form only re-syncs its fields from a live
 * Firestore update when there are no unsaved local changes (`!isDirty`).
 * Syncing on every snapshot regardless would silently overwrite whatever
 * someone is mid-typing the instant anyone else saves anything, anywhere
 * — this isn't a modal dialog that opens fresh each time, it's always on
 * screen. While actively editing, incoming updates pause; saving still
 * uses plain last-write-wins, same as every other module in this app.
 *
 * `totalBudgetCollected` (new): added specifically so the Dashboard's
 * Remaining Budget card has a real number to subtract kitty spend from —
 * nothing in this schema held a total-budget figure before.
 */

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings as SettingsIcon, CheckCircle2 } from "lucide-react"

import { getErrorMessage } from "@/lib/firebase/errors"
import { saveTripSettings, subscribeToTripSettings } from "@/services/settings/settings.service"
import type { SettingsCurrency, TripSettings } from "@/types/settings"

const SETTINGS_CURRENCIES: SettingsCurrency[] = ["INR", "NPR"]

const EMPTY_SETTINGS: TripSettings = {
  tripName: "",
  startDate: "",
  endDate: "",
  currency: "INR",
  emergencyFundAmount: null,
  totalBudgetCollected: null,
  notes: "",
}

interface DraftState {
  tripName: string
  startDate: string
  endDate: string
  currency: SettingsCurrency
  emergencyFundAmount: string
  totalBudgetCollected: string
  notes: string
}

function settingsToDraft(settings: TripSettings): DraftState {
  return {
    tripName: settings.tripName,
    startDate: settings.startDate,
    endDate: settings.endDate,
    currency: settings.currency,
    emergencyFundAmount:
      settings.emergencyFundAmount !== null ? String(settings.emergencyFundAmount) : "",
    totalBudgetCollected:
      settings.totalBudgetCollected !== null ? String(settings.totalBudgetCollected) : "",
    notes: settings.notes,
  }
}

/** Empty string -> null. Negative numbers and non-numeric input also
 *  become null -- the HTML `min` attribute on these inputs is only a
 *  soft hint, so this is the actual enforcement. */
function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

function draftToSettings(draft: DraftState): TripSettings {
  return {
    tripName: draft.tripName.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    currency: draft.currency,
    emergencyFundAmount: parseOptionalNumber(draft.emergencyFundAmount),
    totalBudgetCollected: parseOptionalNumber(draft.totalBudgetCollected),
    notes: draft.notes.trim(),
  }
}

function settingsEqual(a: TripSettings, b: TripSettings): boolean {
  return (
    a.tripName === b.tripName &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    a.currency === b.currency &&
    a.emergencyFundAmount === b.emergencyFundAmount &&
    a.totalBudgetCollected === b.totalBudgetCollected &&
    a.notes === b.notes
  )
}

function LoadingState() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export function SettingsForm() {
  const [saved, setSaved] = React.useState<TripSettings>(EMPTY_SETTINGS)
  const [draft, setDraft] = React.useState<DraftState>(settingsToDraft(EMPTY_SETTINGS))
  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [justSaved, setJustSaved] = React.useState(false)

  const isDirty = React.useMemo(
    () => !settingsEqual(draftToSettings(draft), saved),
    [draft, saved]
  )

  // Kept in a ref so the subscription callback (set up once, in the
  // effect below) always reads the latest isDirty without needing to be
  // torn down and re-subscribed every time a field changes.
  const isDirtyRef = React.useRef(isDirty)
  isDirtyRef.current = isDirty

  // Real-time Firestore subscription — see the file header comment for
  // why `draft` only re-syncs when there are no unsaved local changes.
  React.useEffect(() => {
    const unsubscribe = subscribeToTripSettings(
      (data) => {
        const next = data ?? EMPTY_SETTINGS
        setSaved(next)
        if (!isDirtyRef.current) {
          setDraft(settingsToDraft(next))
        }
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  function updateField<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setJustSaved(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = draftToSettings(draft)
    setIsSaving(true)
    try {
      await saveTripSettings(next)
      setJustSaved(true)
      toast.success("Settings saved")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Trip Settings</CardTitle>
        </div>
        <CardDescription>
          Trip-wide values used across the dashboard — shared with everyone signed in.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-trip-name">Trip Name</Label>
            <Input
              id="settings-trip-name"
              value={draft.tripName}
              onChange={(e) => updateField("tripName", e.target.value)}
              placeholder="e.g. Operation Himalaya"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-start-date">Start Date</Label>
              <Input
                id="settings-start-date"
                type="date"
                value={draft.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-end-date">End Date</Label>
              <Input
                id="settings-end-date"
                type="date"
                value={draft.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-currency">Primary Currency</Label>
              <Select
                value={draft.currency}
                onValueChange={(value) =>
                  updateField("currency", value as SettingsCurrency)
                }
              >
                <SelectTrigger id="settings-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETTINGS_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-emergency-fund">Emergency Fund</Label>
              <Input
                id="settings-emergency-fund"
                type="number"
                min={0}
                inputMode="decimal"
                value={draft.emergencyFundAmount}
                onChange={(e) => updateField("emergencyFundAmount", e.target.value)}
                placeholder="e.g. 38000"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-total-budget">Total Budget Collected (₹)</Label>
              <Input
                id="settings-total-budget"
                type="number"
                min={0}
                inputMode="decimal"
                value={draft.totalBudgetCollected}
                onChange={(e) => updateField("totalBudgetCollected", e.target.value)}
                placeholder="e.g. 360000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-notes">Notes</Label>
            <Textarea
              id="settings-notes"
              value={draft.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything worth noting about how this trip is set up"
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center gap-3">
          <Button type="submit" disabled={!isDirty || isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
          {justSaved && !isDirty && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Saved
            </span>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
