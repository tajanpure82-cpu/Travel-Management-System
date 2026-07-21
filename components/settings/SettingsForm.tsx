"use client"

/**
 * SettingsForm
 * ─────────────────────────────────────────────────────────────────────────
 * Settings is a deliberate architectural exception in this codebase: a
 * singleton form for trip-wide values, not a list-based CRUD module. So
 * there's no SettingsTable, SettingsCard, or AddSettingsDialog — just
 * this one form component, matching this project's own established
 * convention for Settings.
 *
 * No backend: everything is local React state. There's a real Save
 * action (a `draft` state bound to the inputs, committed into a separate
 * `saved` state on submit) rather than silently persisting on every
 * keystroke — matching how every other module here requires a deliberate
 * submit action instead of an implicit autosave. That said, without a
 * persistence layer, both `draft` and `saved` still live only in memory
 * and reset on a page refresh, the same as every other module.
 *
 * Starts blank rather than pre-filled with this project's real trip name
 * and dates (1–11 Aug 2026) — same discipline as every other module's
 * empty starting state, even though those values are real and known.
 */

import * as React from "react"

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
import { Settings as SettingsIcon, CheckCircle2 } from "lucide-react"

export type SettingsCurrency = "INR" | "NPR"

export interface TripSettings {
  tripName: string
  /** ISO date string, or empty if not set. */
  startDate: string
  /** ISO date string, or empty if not set. */
  endDate: string
  currency: SettingsCurrency
  emergencyFundAmount: number | null
  notes: string
}

const SETTINGS_CURRENCIES: SettingsCurrency[] = ["INR", "NPR"]

const EMPTY_SETTINGS: TripSettings = {
  tripName: "",
  startDate: "",
  endDate: "",
  currency: "INR",
  emergencyFundAmount: null,
  notes: "",
}

/** Empty string → null; otherwise parse to a number (NaN also becomes null). */
function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

export function SettingsForm() {
  const [saved, setSaved] = React.useState<TripSettings>(EMPTY_SETTINGS)
  const [draft, setDraft] = React.useState({
    tripName: EMPTY_SETTINGS.tripName,
    startDate: EMPTY_SETTINGS.startDate,
    endDate: EMPTY_SETTINGS.endDate,
    currency: EMPTY_SETTINGS.currency,
    emergencyFundAmount:
      EMPTY_SETTINGS.emergencyFundAmount !== null
        ? String(EMPTY_SETTINGS.emergencyFundAmount)
        : "",
    notes: EMPTY_SETTINGS.notes,
  })
  const [justSaved, setJustSaved] = React.useState(false)

  const isDirty = React.useMemo(() => {
    return (
      draft.tripName !== saved.tripName ||
      draft.startDate !== saved.startDate ||
      draft.endDate !== saved.endDate ||
      draft.currency !== saved.currency ||
      draft.emergencyFundAmount !==
        (saved.emergencyFundAmount !== null ? String(saved.emergencyFundAmount) : "") ||
      draft.notes !== saved.notes
    )
  }, [draft, saved])

  function updateField<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setJustSaved(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: TripSettings = {
      tripName: draft.tripName.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      currency: draft.currency,
      emergencyFundAmount: parseOptionalNumber(draft.emergencyFundAmount),
      notes: draft.notes.trim(),
    }
    setSaved(next)
    setJustSaved(true)
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Trip Settings</CardTitle>
        </div>
        <CardDescription>
          Trip-wide values used across the dashboard. Nothing here is saved to a
          server — it lives in this browser session only.
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
          <Button type="submit" disabled={!isDirty}>
            Save Changes
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
