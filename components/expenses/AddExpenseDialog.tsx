"use client"

/**
 * AddExpenseDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Fully controlled Add/Edit dialog for a single expense — no
 * <DialogTrigger> of its own, driven entirely by `open`/`expense` props
 * from ExpenseTable.
 *
 * "Split" is now Shared/Personal + (when Shared) an explicit checkbox
 * list of exactly who this expense applies to — not an all-or-nothing
 * toggle. This is what makes "only the 4 people who smoke" possible.
 * "Select all" / "Clear" are convenience buttons over the same checkbox
 * list, for the common case of splitting among everyone.
 *
 * Receipt upload and the Paid By dropdown are unchanged from the earlier
 * relationship work — this dialog already subscribed to Travellers for
 * that, and the same subscription now also feeds the split checklist.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Paperclip, Loader2, X } from "lucide-react"

import { deleteFileByUrl, uploadFile } from "@/lib/firebase/storage"
import { subscribeToTravellers } from "@/services/travellers/travellers.service"
import type { Traveller } from "@/types/traveller"
import type {
  Expense,
  ExpenseCategory,
  ExpenseCurrency,
  ExpenseSplitType,
  NewExpense,
} from "@/types/expense"

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

/** 5 MB — a reasonable ceiling for a phone photo of a receipt. */
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
const ACCEPTED_RECEIPT_TYPES = "image/*,application/pdf"

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Expense being edited, or null/undefined to add a new one. */
  expense?: Expense | null
  /** `id` is present only in edit mode. */
  onSubmit: (data: NewExpense, id?: string) => void
}

interface FormState {
  date: string
  category: ExpenseCategory
  description: string
  amount: string
  currency: ExpenseCurrency
  paidById: string
  splitType: ExpenseSplitType
  splitAmongIds: string[]
}

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
    paidById: "",
    splitType: "Shared",
    splitAmongIds: [],
  }
}

function expenseToForm(expense: Expense): FormState {
  return {
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: String(expense.amount),
    currency: expense.currency,
    paidById: expense.paidById,
    splitType: expense.splitType,
    splitAmongIds: expense.splitAmongIds,
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
  const [travellers, setTravellers] = React.useState<Traveller[]>([])
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [removeExistingReceipt, setRemoveExistingReceipt] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Read-only subscription — feeds both the "Paid By" dropdown and the
  // "Split Among" checklist. This dialog never writes to Travellers.
  React.useEffect(() => {
    const unsubscribe = subscribeToTravellers((data) => setTravellers(data))
    return unsubscribe
  }, [])

  // Re-seed the form every time the dialog opens, matching whichever
  // expense (if any) it was opened for.
  React.useEffect(() => {
    if (!open) return
    setForm(expense ? expenseToForm(expense) : emptyForm())
    setError(null)
    setSelectedFile(null)
    setRemoveExistingReceipt(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [open, expense])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleParticipant(travellerId: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      splitAmongIds: checked
        ? [...prev.splitAmongIds, travellerId]
        : prev.splitAmongIds.filter((id) => id !== travellerId),
    }))
  }

  function handleSelectAll() {
    setForm((prev) => ({ ...prev, splitAmongIds: travellers.map((t) => t.id) }))
  }

  function handleClearAll() {
    setForm((prev) => ({ ...prev, splitAmongIds: [] }))
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (file && file.size > MAX_RECEIPT_BYTES) {
      setError("Receipt file is too large — 5 MB maximum.")
      event.target.value = ""
      return
    }
    setError(null)
    setSelectedFile(file)
    setRemoveExistingReceipt(false)
  }

  function handleRemoveReceipt() {
    setSelectedFile(null)
    setRemoveExistingReceipt(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (!form.paidById) {
      setError("Select who paid.")
      return
    }

    const paidTraveller = travellers.find((t) => t.id === form.paidById)
    if (!paidTraveller) {
      setError("That traveller no longer exists — pick someone else.")
      return
    }

    if (form.splitType === "Shared" && form.splitAmongIds.length === 0) {
      setError("Select at least one person this expense is shared with.")
      return
    }

    setIsSubmitting(true)
    try {
      let receiptUrl: string | null = expense?.receiptUrl ?? null

      if (selectedFile) {
        const path = `expense-receipts/${crypto.randomUUID()}-${selectedFile.name}`
        const newUrl = await uploadFile(path, selectedFile)
        if (expense?.receiptUrl) {
          await deleteFileByUrl(expense.receiptUrl)
        }
        receiptUrl = newUrl
      } else if (removeExistingReceipt && expense?.receiptUrl) {
        await deleteFileByUrl(expense.receiptUrl)
        receiptUrl = null
      }

      const splitAmong =
        form.splitType === "Shared"
          ? travellers.filter((t) => form.splitAmongIds.includes(t.id))
          : []

      const data: NewExpense = {
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        amount,
        currency: form.currency,
        paidById: paidTraveller.id,
        paidByName: paidTraveller.name,
        splitType: form.splitType,
        splitAmongIds: splitAmong.map((t) => t.id),
        splitAmongNames: splitAmong.map((t) => t.name),
        receiptUrl,
      }

      onSubmit(data, expense?.id)
    } catch (uploadError) {
      setError("Couldn't upload the receipt. Please try again.")
      console.error("[AddExpenseDialog] receipt upload failed:", uploadError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentReceiptLabel = selectedFile
    ? selectedFile.name
    : !removeExistingReceipt && expense?.receiptUrl
      ? "Current receipt attached"
      : null

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
                placeholder="e.g. Fuel fill-up at Nagpur, Cigarettes"
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
              <Label htmlFor="expense-paid-by">Paid By *</Label>
              <Select
                value={form.paidById}
                onValueChange={(value) => updateField("paidById", value)}
              >
                <SelectTrigger id="expense-paid-by">
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {travellers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Add travellers first
                    </div>
                  ) : (
                    travellers.map((traveller) => (
                      <SelectItem key={traveller.id} value={traveller.id}>
                        {traveller.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-split-type">Split</Label>
              <Select
                value={form.splitType}
                onValueChange={(value) => updateField("splitType", value as ExpenseSplitType)}
              >
                <SelectTrigger id="expense-split-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shared">Shared</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.splitType === "Shared" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Split Among *</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-xs text-muted-foreground">·</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {travellers.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Add travellers first, then come back to split this expense.
                </p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                  {travellers.map((traveller) => (
                    <div key={traveller.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`expense-participant-${traveller.id}`}
                        checked={form.splitAmongIds.includes(traveller.id)}
                        onCheckedChange={(checked) =>
                          toggleParticipant(traveller.id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`expense-participant-${traveller.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {traveller.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Only check who this specific expense applies to — e.g. just the people who
                smoke, drink, or ordered non-veg. Everyone else won't owe anything for it.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-receipt">Receipt (optional)</Label>
            <Input
              id="expense-receipt"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_RECEIPT_TYPES}
              onChange={handleFileChange}
            />
            {currentReceiptLabel && (
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 truncate">
                  <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {currentReceiptLabel}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="shrink-0 rounded p-0.5 hover:bg-muted"
                  aria-label="Remove receipt"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Photo or PDF of the receipt, up to 5 MB. Optional — not every expense has one.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting
                ? selectedFile
                  ? "Uploading…"
                  : "Saving…"
                : isEditMode
                  ? "Save Changes"
                  : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
