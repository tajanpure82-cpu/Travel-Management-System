import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ChecklistTable } from "@/components/checklist/ChecklistTable"

/**
 * Checklist route.
 * Renders the shared DashboardLayout shell with the Checklist module
 * (search, pending-only filter, table/card views, add/edit/delete) as
 * its content.
 */
export default function ChecklistPage() {
  return (
    <DashboardLayout title="Checklist" subtitle="Pre-trip prep and daily tasks">
      <ChecklistTable />
    </DashboardLayout>
  )
}
