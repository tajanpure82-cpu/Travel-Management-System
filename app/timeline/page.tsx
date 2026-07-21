import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TimelineTable } from "@/components/timeline/TimelineTable"

/**
 * Timeline route.
 * Renders the shared DashboardLayout shell with the Trip Timeline module
 * (search, hide-completed filter, table/card views, add/edit/delete) as
 * its content.
 */
export default function TimelinePage() {
  return (
    <DashboardLayout title="Trip Timeline" subtitle="The route, day by day">
      <TimelineTable />
    </DashboardLayout>
  )
}
