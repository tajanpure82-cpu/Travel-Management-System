"use client"

/**
 * ExpenseCard
 * ─────────────────────────────────────────────────────────────────────────
 * Presentational card for a single expense — used by ExpenseTable's Card
 * View. Shows the split type badge (Shared with a count, or Personal) and
 * — when Shared — exactly who it applies to, so it's clear at a glance
 * this isn't split among everyone by default.
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
import { Pencil, Trash2, Calendar, Tag, User, Paperclip } from "lucide-react"

import type { Expense, ExpenseCurrency } from "@/types/expense"

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/** Kept local rather than imported — see the note in ExpenseTable's
 *  TableView about avoiding a value-level circular import for small
 *  pure functions. */
function splitBadgeVariant(splitType: Expense["splitType"]): "default" | "outline" {
  return splitType === "Shared" ? "default" : "outline"
}

function formatAmount(amount: number, currency: ExpenseCurrency): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return `NPR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {expense.description || "Untitled expense"}
            </CardTitle>
            <CardDescription className="text-lg font-semibold text-foreground">
              {formatAmount(expense.amount, expense.currency)}
            </CardDescription>
          </div>
          <Badge variant={splitBadgeVariant(expense.splitType)} className="shrink-0">
            {expense.splitType === "Shared"
              ? `Shared (${expense.splitAmongIds.length})`
              : "Personal"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{expense.date || "No date set"}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{expense.category}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Paid by {expense.paidByName || "unassigned"}</span>
        </div>

        {expense.splitType === "Shared" && expense.splitAmongNames.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Split among: {expense.splitAmongNames.join(", ")}
          </p>
        )}

        {expense.receiptUrl && (
          <a
            href={expense.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
          >
            <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>View receipt</span>
          </a>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onEdit(expense)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(expense)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
