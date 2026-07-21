import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SummaryCards } from "@/components/dashboard/SummaryCards"

/**
 * Dashboard home route.
 * Renders the shared DashboardLayout shell with SummaryCards as its content.
 */
export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard" subtitle="Operation Himalaya at a glance">
      <SummaryCards />
    </DashboardLayout>
  )
}
