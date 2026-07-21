import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { FuelTable } from "@/components/fuel/FuelTable"

/**
 * Fuel route.
 * Renders the shared DashboardLayout shell with the Fuel Log module
 * (search, table/card views, add/edit/delete) as its content.
 */
export default function FuelPage() {
  return (
    <DashboardLayout title="Fuel" subtitle="Log every fill-up across the fleet">
      <FuelTable />
    </DashboardLayout>
  )
}
