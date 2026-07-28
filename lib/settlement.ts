/**
 * settlement
 * ─────────────────────────────────────────────────────────────────────────
 * Pure calculation logic for splitting group expenses — no Firestore, no
 * UI, just the math. Kept separate from ExpenseTable.tsx so it's
 * independently readable and (if this project ever adds tests) testable
 * on its own.
 *
 * Two functions:
 *   computeBalances    — for each person: what they paid, what their
 *                         fair share of everything they were part of
 *                         came to, and the difference (net balance).
 *   computeSettlements — turns those net balances into the minimum
 *                         number of actual payments needed to settle
 *                         everyone up. Same greedy debt-simplification
 *                         approach real settle-up apps use: the biggest
 *                         debtor pays the biggest creditor first, repeat.
 *
 * Both operate on one currency at a time — currencies are never blended,
 * same rule as everywhere else in this app. Personal expenses never
 * factor in here at all; they're not shared costs.
 */

import type { Expense, ExpenseCurrency } from "@/types/expense"

export interface PersonBalance {
  travellerId: string
  travellerName: string
  /** Total they paid out of pocket for Shared expenses. */
  paid: number
  /** Their fair share of every Shared expense they were part of. */
  owed: number
  /** paid − owed. Positive: the group owes them. Negative: they owe the
   *  group. */
  net: number
}

export interface SettlementTransaction {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

/** Below this amount, a balance or payment is treated as already
 *  settled — avoids suggesting someone pay back ₹0.03 from a rounding
 *  remainder. */
const SETTLED_THRESHOLD = 0.5

export function computeBalances(
  expenses: Expense[],
  currency: ExpenseCurrency
): PersonBalance[] {
  const balances = new Map<string, PersonBalance>()

  function getOrCreate(id: string, name: string): PersonBalance {
    let existing = balances.get(id)
    if (!existing) {
      existing = { travellerId: id, travellerName: name, paid: 0, owed: 0, net: 0 }
      balances.set(id, existing)
    }
    return existing
  }

  for (const expense of expenses) {
    if (expense.splitType !== "Shared") continue
    if (expense.currency !== currency) continue
    if (expense.splitAmongIds.length === 0) continue

    const payer = getOrCreate(expense.paidById, expense.paidByName)
    payer.paid += expense.amount

    const share = expense.amount / expense.splitAmongIds.length
    expense.splitAmongIds.forEach((participantId, index) => {
      const participantName = expense.splitAmongNames[index] ?? "Unknown"
      const participant = getOrCreate(participantId, participantName)
      participant.owed += share
    })
  }

  for (const balance of balances.values()) {
    balance.net = balance.paid - balance.owed
  }

  return Array.from(balances.values()).sort((a, b) => b.net - a.net)
}

export function computeSettlements(balances: PersonBalance[]): SettlementTransaction[] {
  const creditors = balances
    .filter((b) => b.net > SETTLED_THRESHOLD)
    .map((b) => ({ id: b.travellerId, name: b.travellerName, remaining: b.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const debtors = balances
    .filter((b) => b.net < -SETTLED_THRESHOLD)
    .map((b) => ({ id: b.travellerId, name: b.travellerName, remaining: -b.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const transactions: SettlementTransaction[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.remaining, creditor.remaining)

    if (amount > SETTLED_THRESHOLD) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: Math.round(amount),
      })
    }

    debtor.remaining -= amount
    creditor.remaining -= amount

    if (debtor.remaining <= SETTLED_THRESHOLD) i++
    if (creditor.remaining <= SETTLED_THRESHOLD) j++
  }

  return transactions
}
