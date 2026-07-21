"use client"

/**
 * AddExpenseDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single expense — same pattern as
 * AddTravellerDialog / AddVehicleDialog: no <DialogTrigger> of its own,
 * driven entirely by `open`/`expense` props from ExpenseTable.
 *
 * Mode is inferred from `expense`: null/undefined = Add, an Expense = Edit.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type {
  Expense,
  ExpenseCategory,
  ExpenseCurrency,
  ExpenseSplit,
} from "./ExpenseTable"

// Local copies of the option lists — kept in this file (rather than
// imported as values from ExpenseTable) purely to avoid a value-level
// circular import between the two sibling components. Only *types* are
// shared across files here.
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Fuel",
  "Toll",
  "Hotel",
  "Food",
  "Activity",
  "Documents & Permits",
  "Insurance",
  "Shopping",
  "Emergency",
  "Misc",
]

const EXPENSE_CURRENCIES: ExpenseCurrency[] = ["INR", "NPR"]

const EXPENSE_SPLITS: ExpenseSplit[] = ["Kitty", "Personal"]

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Expense being edited, or null/undefined to add a new one. */
  expense?: Expense | null
  onSubmit: (expense: Expense) => void
}

interface FormState {
  date: string
  category: ExpenseCategory
  description: string
  amount: string
  currency: ExpenseCurrency
  paidBy: string
  split: ExpenseSplit
}

/** Today's date as "YYYY-MM-DD", for a sensible default on new expenses. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(): FormState {
  return {
    date: todayIso(),
    category: "Fuel",
    description: "",
    amount: "",
    currency: "INR",
    paidBy: "",
    split: "Kitty",
  }
}

function expenseToForm(expense: Expense): FormState {
  return {
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: String(expense.amount),
    currency: expense.currency,
    paidBy: expense.paidBy,
    split: expense.split,
  }
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
}: AddExpenseDialogProps) {
  const isEditMode = Boolean(expense)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

  // Re-seed the form every time the dialog opens, matching whichever
  // expense (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(expense ? expenseToForm(expense) : emptyForm())
    setError(null)
  }, [open, expense])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.description.trim()) {
      setError("Description is required.")
      return
    }

    const amount = Number(form.amount)
    if (form.amount.trim() === "" || Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount greater than 0.")
      return
    }

    onSubmit({
      id: expense?.id ?? crypto.randomUUID(),
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount,
      currency: form.currency,
      paidBy: form.paidBy.trim(),
      split: form.split,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this expense's details."
              : "Log a fuel fill, toll, hotel payment, or anything else."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="expense-description">Description *</Label>
              <Input
                id="expense-description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="e.g. Fuel fill-up at Nagpur"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => updateField("category", value as ExpenseCategory)}
              >
                <SelectTrigger id="expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount *</Label>
              <Input
                id="expense-amount"
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) => updateField("currency", value as ExpenseCurrency)}
              >
                <SelectTrigger id="expense-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-paid-by">Paid By</Label>
              <Input
                id="expense-paid-by"
                value={form.paidBy}
                onChange={(e) => updateField("paidBy", e.target.value)}
                placeholder="Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-split">Split</Label>
              <Select
                value={form.split}
                onValueChange={(value) => updateField("split", value as ExpenseSplit)}
              >
                <SelectTrigger id="expense-split">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_SPLITS.map((split) => (
                    <SelectItem key={split} value={split}>
                      {split}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Expense"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
