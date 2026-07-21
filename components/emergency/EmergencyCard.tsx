"use client"

/**
 * EmergencyCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single emergency contact — used by
 * EmergencyTable's Card View. Deliberately calm styling (see the note in
 * EmergencyTable) — the phone number is the one element that gets a
 * clear, tappable treatment.
 */

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
import { Pencil, Trash2, Phone, MapPin } from "lucide-react"

import type { EmergencyContact } from "./EmergencyTable"

interface EmergencyCardProps {
  contact: EmergencyContact
  onEdit: (contact: EmergencyContact) => void
  onDelete: (contact: EmergencyContact) => void
}

export function EmergencyCard({ contact, onEdit, onDelete }: EmergencyCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{contact.name || "Unnamed"}</CardTitle>
            <CardDescription>
              <Badge variant="outline">{contact.category}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            {contact.phone}
          </a>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>No phone on file</span>
          </div>
        )}

        {contact.city && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{contact.city}</span>
          </div>
        )}

        {contact.notes && (
          <>
            <Separator />
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              {contact.notes}
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onEdit(contact)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(contact)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
