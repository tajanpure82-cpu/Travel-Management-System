"use client"

/**
 * ExpenseTable
 * ─────────────────────────────────────────────────────────────────────────
 * The Expense Management module's container component — Firestore-backed.
 *
 * The old "Per-Person Kitty Contribution" section is replaced with a full
 * Settlement section: per-person Paid/Owed/Net balances, plus concrete
 * "X pays Y ₹amount" instructions — computed via lib/settlement.ts, kept
 * separate from this file since it's pure calculation logic, not UI.
 *
 * Computed once per currency (INR always shown if there's any Shared INR
 * spend; NPR only shown if there's Shared NPR spend) — currencies are
 * never blended, same rule as everywhere else in this app, and this is
 * real money changing hands between real people, not just a display
 * estimate.
 *
 * "Kitty only" filter renamed to "Shared only", matching the renamed
 * concept (splitType, not the old binary "split" field).
 */

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Paperclip,
  Scale,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"

import { ExpenseCard } from "./ExpenseCard"
import { AddExpenseDialog } from "./AddExpenseDialog"
import { getErrorMessage } from "@/lib/firebase/errors"
import { deleteFileByUrl } from "@/lib/firebase/storage"
import { computeBalances, computeSettlements } from "@/lib/settlement"
import {
  addExpense,
  deleteExpense,
  subscribeToExpenses,
  updateExpense,
} from "@/services/expenses/expenses.service"
import type { Expense, ExpenseCurrency, NewExpense } from "@/types/expense"

/* -------------------------------------------------------------------------- */
/*                               Local helpers                                */
/* -------------------------------------------------------------------------- */

type ViewMode = "table" | "card"

type DialogState = { mode: "add" } | { mode: "edit"; expense: Expense } | null

function splitBadgeVariant(splitType: Expense["splitType"]): "default" | "outline" {
  return splitType === "Shared" ? "default" : "outline"
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
/*                             Settlement section                            */
/* -------------------------------------------------------------------------- */

interface SettlementSectionProps {
  expenses: Expense[]
  currency: ExpenseCurrency
}

function SettlementSection({ expenses, currency }: SettlementSectionProps) {
  const balances = React.useMemo(
    () => computeBalances(expenses, currency),
    [expenses, currency]
  )
  const settlements = React.useMemo(() => computeSettlements(balances), [balances])

  if (balances.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm font-medium">
            Settlement {currency !== "INR" ? `(${currency})` : ""}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Balances */}
        <div className="space-y-2">
          {balances.map((person) => (
            <div
              key={person.travellerId}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{person.travellerName}</span>
              <div className="text-right">
                <span
                  className={
                    person.net > 0.5
                      ? "font-medium text-emerald-600 dark:text-emerald-400"
                      : person.net < -0.5
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {person.net > 0.5
                    ? `Owed ${formatAmount(person.net, currency)}`
                    : person.net < -0.5
                      ? `Owes ${formatAmount(-person.net, currency)}`
                      : "Settled"}
                </span>
                <p className="text-xs text-muted-foreground">
                  Paid {formatAmount(person.paid, currency)} · Fair share{" "}
                  {formatAmount(person.owed, currency)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Concrete "who pays whom" instructions */}
        {settlements.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">To settle up:</p>
            {settlements.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="font-medium">{transaction.fromName}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">{transaction.toName}</span>
                <span className="ml-auto font-semibold">
                  {formatAmount(transaction.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
                <div className="flex items-center gap-1.5">
                  {expense.receiptUrl && (
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View receipt"
                      className="shrink-0 text-primary hover:text-primary/80"
                    >
                      <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                  <span className="truncate">{expense.description || "—"}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {formatAmount(expense.amount, expense.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {expense.paidByName || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={splitBadgeVariant(expense.splitType)}>
                  {expense.splitType === "Shared"
                    ? `Shared (${expense.splitAmongIds.length})`
                    : "Personal"}
                </Badge>
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
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showSharedOnly, setShowSharedOnly] = React.useState(false)
  const [dialogState, setDialogState] = React.useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Real-time Firestore subscription — fires immediately with the current
  // data, then again on every add/edit/delete from any browser/device.
  React.useEffect(() => {
    const unsubscribe = subscribeToExpenses(
      (data) => {
        setExpenses(data)
        setLoading(false)
      },
      (error) => {
        toast.error(getErrorMessage(error))
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const filteredExpenses = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return expenses.filter((expense) => {
      if (showSharedOnly && expense.splitType !== "Shared") return false
      if (!query) return true
      return (
        expense.description.toLowerCase().includes(query) ||
        expense.paidByName.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query)
      )
    })
  }, [expenses, searchQuery, showSharedOnly])

  const sharedTotals = React.useMemo(() => {
    return expenses.reduce(
      (totals, expense) => {
        if (expense.splitType !== "Shared") return totals
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

  async function handleDialogSubmit(data: NewExpense, id?: string) {
    try {
      if (id) {
        await updateExpense(id, data)
        toast.success("Expense updated")
      } else {
        await addExpense(data)
        toast.success("Expense added")
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
      await deleteExpense(deleteTarget.id)
      if (deleteTarget.receiptUrl) {
        await deleteFileByUrl(deleteTarget.receiptUrl)
      }
      toast.success("Expense deleted")
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const totalsSummary =
    sharedTotals.npr > 0
      ? `${formatAmount(sharedTotals.inr, "INR")} + ${formatAmount(sharedTotals.npr, "NPR")} shared`
      : `${formatAmount(sharedTotals.inr, "INR")} shared`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Expenses</h2>
        <p className="text-sm text-muted-foreground">
          {expenses.length} expense{expenses.length === 1 ? "" : "s"} · {totalsSummary}
        </p>
      </div>

      {/* Settlement — one block per currency that actually has shared spend */}
      {!loading && (
        <>
          <SettlementSection expenses={expenses} currency="INR" />
          {sharedTotals.npr > 0 && <SettlementSection expenses={expenses} currency="NPR" />}
        </>
      )}

      {/* Toolbar: search, shared-only filter, view toggle, add */}
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
            variant={showSharedOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            aria-pressed={showSharedOnly}
            onClick={() => setShowSharedOnly((prev) => !prev)}
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Shared only
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
      {loading ? (
        <LoadingState />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses yet"
          description="Log every purchase — choose exactly who each one is shared with, so settlement at the end is exact, not a guess."
          actionLabel="Add Expense"
          onAction={handleAddClick}
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term, or clear the Shared-only filter."
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
          if (!isOpen && !isDeleting) setDeleteTarget(null)
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
                  )}) will be removed${deleteTarget.receiptUrl ? ", including its attached receipt" : ""}. This can't be undone from here.`
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
