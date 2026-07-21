import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TollTable } from "@/components/tolls/TollTable"

/**
 * Tolls route.
 * Renders the shared DashboardLayout shell with the Toll Log module
 * (search, table/card views, add/edit/delete) as its content.
 */
export default function TollsPage() {
  return (
    <DashboardLayout title="Tolls" subtitle="Every toll plaza, split by car">
      <TollTable />
    </DashboardLayout>
  )
}
