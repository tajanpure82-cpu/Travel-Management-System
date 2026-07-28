"use client"

/**
 * VehicleCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single vehicle — used by VehicleTable's Card
 * View. Only the type import changed for the Firestore migration (now
 * from @/types/vehicle instead of sideways from ./VehicleTable) — this
 * component has no idea Firestore exists, same as before.
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
import { Pencil, Trash2, Hash, Users, User, Fuel, Gauge, Wrench } from "lucide-react"

import type { Vehicle, VehicleStatus } from "@/types/vehicle"

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

/** Kept local rather than imported — see the note in VehicleTable's
 *  TableView about avoiding a value-level circular import for a 3-line
 *  helper. */
function statusBadgeVariant(
  status: VehicleStatus
): "default" | "secondary" | "destructive" {
  if (status === "Available") return "default"
  if (status === "In Use") return "secondary"
  return "destructive" // Maintenance
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const needsAttention = vehicle.status === "Maintenance"

  return (
    <Card
      className={cn("flex flex-col", needsAttention && "border-l-4 border-l-destructive")}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{vehicle.name}</CardTitle>
            <CardDescription className="truncate">{vehicle.type}</CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(vehicle.status)} className="shrink-0">
            {vehicle.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{vehicle.registrationNumber || "No registration on file"}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {vehicle.seatingCapacity !== null
              ? `${vehicle.seatingCapacity} seats`
              : "Capacity not set"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{vehicle.driverAssigned || "Unassigned"}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Fuel className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{vehicle.fuelType}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {vehicle.mileage !== null ? `${vehicle.mileage} km/l` : "Mileage not set"}
          </span>
        </div>

        {vehicle.notes && (
          <>
            <Separator />
            <div
              className={cn(
                "flex items-start gap-2 rounded-md p-2 text-xs",
                needsAttention
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              {needsAttention && (
                <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{vehicle.notes}</span>
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
          onClick={() => onEdit(vehicle)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(vehicle)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
