import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ExpenseTable } from "@/components/expenses/ExpenseTable"

/**
 * Expenses route.
 * Renders the shared DashboardLayout shell with the Expense Management
 * module (search, kitty filter, table/card views, add/edit/delete) as its
 * content.
 */
export default function ExpensesPage() {
  return (
    <DashboardLayout title="Expenses" subtitle="Track kitty and personal spend">
      <ExpenseTable />
    </DashboardLayout>
  )
}
