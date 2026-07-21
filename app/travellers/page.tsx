import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TravellerTable } from "@/components/travellers/TravellerTable"

export default function TravellersPage() {
  return (
    <DashboardLayout
      title="Travellers"
      subtitle="Manage everyone joining the trip"
    >
      <TravellerTable />
    </DashboardLayout>
  )
}