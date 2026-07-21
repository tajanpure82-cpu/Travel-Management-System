"use client"

/**
 * ExpenseTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Expense Management module's container component — same architecture
 * as TravellerTable/VehicleTable: owns the shared list state, search, a
 * "Kitty only" filter, view-mode toggle, and the add/edit/delete flows.
 * ExpenseCard and AddExpenseDialog are both presentational/controlled and
 * take everything they need as props.
 *
 * No backend: `expenses` is local React state only, starting empty. This
 * is a separate module from the Dashboard's Budget Progress card — the
 * two aren't wired together (no shared data layer yet), so logging an
 * expense here does not update Dashboard totals. Wiring them would mean
 * lifting state to a shared store, out of scope for now.
 *
 * Fields (Date, Category, Description, Amount, Currency, Paid By, Split)
 * mirror this project's own Operations Kit "Expense Tracker" sheet rather
 * than an invented shape — Split (Kitty/Personal) is the trip's real
 * budgeting rule: the kitty pays for shared things only.
 */

import * as React from "react"

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
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { ExpenseCard } from "./ExpenseCard"
import { AddExpenseDialog } from "./AddExpenseDialog"

/* -------------------------------------------------------------------------- */
/*                          Shared types (exported)                          */
/* -------------------------------------------------------------------------- */

export type ExpenseCategory =
  | "Fuel"
  | "Toll"
  | "Hotel"
  | "Food"
  | "Activity"
  | "Documents & Permits"
  | "Insurance"
  | "Shopping"
  | "Emergency"
  | "Misc"

export type ExpenseCurrency = "INR" | "NPR"

export type ExpenseSplit = "Kitty" | "Personal"

export interface Expense {
  id: string
  /** ISO date string, e.g. "2026-08-01". */
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  currency: ExpenseCurrency
  paidBy: string
  split: ExpenseSplit
}

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; expense: Expense } | null

/** Kept local to each file that needs it (also duplicated in ExpenseCard)
 *  rather than exported, purely to avoid a value-level circular import
 *  between the sibling files for a small pure function. */
function splitBadgeVariant(split: ExpenseSplit): "default" | "outline" {
  return split === "Kitty" ? "default" : "outline"
}

/** Formats an amount with its currency — INR gets full Intl currency
 *  formatting (₹ + Indian digit grouping); NPR is shown plainly since
 *  Intl.NumberFormat has no built-in NPR currency symbol support. */
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
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

function TableView({ expenses, onEdit, onDelete }: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid By</TableHead>
            <TableHead>Split</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {expense.date || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">{expense.category}</TableCell>
              <TableCell className="max-w-[220px] truncate">
                {expense.description || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {formatAmount(expense.amount, expense.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {expense.paidBy || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={splitBadgeVariant(expense.split)}>{expense.split}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit expense: ${expense.description}`}
                    onClick={() => onEdit(expense)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete expense: ${expense.description}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(expense)}
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
/*                                ExpenseTable                               */
/* -------------------------------------------------------------------------- */

export function ExpenseTable() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showKittyOnly, setShowKittyOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null)

  const filteredExpenses = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return expenses.filter((expense) => {
      if (showKittyOnly && expense.split !== "Kitty") return false
      if (!query) return true
      return (
        expense.description.toLowerCase().includes(query) ||
        expense.paidBy.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query)
      )
    })
  }, [expenses, searchQuery, showKittyOnly])

  // Kitty totals, kept per-currency rather than blended into one figure —
  // silently converting NPR to INR at a hardcoded rate would be a real
  // accuracy risk in an actual ledger, not just a planning estimate.
  const kittyTotals = React.useMemo(() => {
    return expenses.reduce(
      (totals, expense) => {
        if (expense.split !== "Kitty") return totals
        if (expense.currency === "INR") totals.inr += expense.amount
        else totals.npr += expense.amount
        return totals
      },
      { inr: 0, npr: 0 }
    )
  }, [expenses])

  function handleAddClick() {
    setDialogState({ mode: "add" })
  }

  function handleEditClick(expense: Expense) {
    setDialogState({ mode: "edit", expense })
  }

  function handleDeleteClick(expense: Expense) {
    setDeleteTarget(expense)
  }

  function handleDialogSubmit(expense: Expense) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id)
      return exists
        ? prev.map((e) => (e.id === expense.id ? expense : e))
        : [...prev, expense]
    })
    setDialogState(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const kittySummary =
    kittyTotals.npr > 0
      ? `${formatAmount(kittyTotals.inr, "INR")} + ${formatAmount(kittyTotals.npr, "NPR")} kitty spend`
      : `${formatAmount(kittyTotals.inr, "INR")} kitty spend`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Expenses</h2>
        <p className="text-sm text-muted-foreground">
          {expenses.length} expense{expenses.length === 1 ? "" : "s"} · {kittySummary}
        </p>
      </div>

      {/* Toolbar: search, kitty-only filter, view toggle, add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description, payer, or category…"
            className="pl-8"
            aria-label="Search expenses"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={showKittyOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={showKittyOnly}
            onClick={() => setShowKittyOnly((prev) => !prev)}
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Kitty only
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
            Add Expense
          </Button>
        </div>
      </div>

      {/* Content */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses yet"
          description="Log fuel fills, tolls, hotel payments, and everything else — kitty spend and personal spend are tracked separately."
          actionLabel="Add Expense"
          onAction={handleAddClick}
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the Kitty-only filter."
        />
      ) : viewMode === "table" ? (
        <TableView
          expenses={filteredExpenses}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog — fully controlled, opened from the button above
          or from any row/card's Edit action. */}
      <AddExpenseDialog
        open={dialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogState(null)
        }}
        expense={dialogState?.mode === "edit" ? dialogState.expense : null}
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
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.description}" (${formatAmount(
                    deleteTarget.amount,
                    deleteTarget.currency
                  )}) will be removed. This can't be undone from here.`
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
