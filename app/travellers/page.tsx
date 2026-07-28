import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TravellerTable } from "@/components/travellers/TravellerTable"

/**
 * Travellers route. Reviewed as part of the CRUD bugfix — no Firestore
 * logic lives here at all, so there was nothing to change. Included for
 * a complete, consistent delivery.
 */
export default function TravellersPage() {
  return (
    <DashboardLayout title="Travellers" subtitle="Manage everyone joining the trip">
      <TravellerTable />
    </DashboardLayout>
  )
}
