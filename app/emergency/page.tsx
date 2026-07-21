import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { EmergencyTable } from "@/components/emergency/EmergencyTable"

/**
 * Emergency route.
 * Renders the shared DashboardLayout shell with the Emergency Contacts
 * module (search, table/card views, add/edit/delete) as its content.
 */
export default function EmergencyPage() {
  return (
    <DashboardLayout title="Emergency" subtitle="Contacts to call when it matters">
      <EmergencyTable />
    </DashboardLayout>
  )
}
