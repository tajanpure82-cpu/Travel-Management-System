"use client"

/**
 * TravellerCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single traveller — used by TravellerTable's
 * Card View. Shows `assignedVehicleName` (the real Vehicle reference's
 * display name) instead of the old fixed "Car A"/"Car B" enum.
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
import { Pencil, Trash2, Phone, Car, Droplet, AlertTriangle } from "lucide-react"

import type { Traveller, DocumentStatus } from "@/types/traveller"

interface TravellerCardProps {
  traveller: Traveller
  onEdit: (traveller: Traveller) => void
  onDelete: (traveller: Traveller) => void
}

function documentBadgeVariant(
  status: DocumentStatus
): "default" | "destructive" | "secondary" {
  if (status === "Valid") return "default"
  if (status === "Expired") return "destructive"
  return "secondary"
}

export function TravellerCard({ traveller, onEdit, onDelete }: TravellerCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        traveller.isDriver && "border-l-4 border-l-primary"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{traveller.name}</CardTitle>
            {traveller.nickname && (
              <CardDescription className="truncate">
                &ldquo;{traveller.nickname}&rdquo;
              </CardDescription>
            )}
          </div>
          {traveller.isDriver && (
            <Badge variant="outline" className="shrink-0 gap-1">
              <Car className="h-3 w-3" aria-hidden="true" />
              Driver
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{traveller.phone || "No phone on file"}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Droplet className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{traveller.bloodGroup}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Car className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {traveller.assignedVehicleName ?? "Unassigned"}
            {traveller.seatNumber ? ` · Seat ${traveller.seatNumber}` : ""}
          </span>
        </div>

        {traveller.emergencyContact && (
          <p className="text-xs text-muted-foreground">
            Emergency contact: {traveller.emergencyContact}
          </p>
        )}

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Badge variant={documentBadgeVariant(traveller.passportStatus)}>
            Passport: {traveller.passportStatus}
          </Badge>
          <Badge variant={documentBadgeVariant(traveller.voterIdStatus)}>
            Voter ID: {traveller.voterIdStatus}
          </Badge>
        </div>

        {traveller.medicalNotes && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{traveller.medicalNotes}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onEdit(traveller)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(traveller)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
