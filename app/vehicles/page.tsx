import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { VehicleTable } from "@/components/vehicles/VehicleTable"

/**
 * Vehicles route.
 * Renders the shared DashboardLayout shell with the Vehicle Management
 * module (search, table/card views, add/edit/delete) as its content.
 */
export default function VehiclesPage() {
  return (
    <DashboardLayout title="Vehicles" subtitle="Track your fleet, drivers, and maintenance status">
      <VehicleTable />
    </DashboardLayout>
  )
}
