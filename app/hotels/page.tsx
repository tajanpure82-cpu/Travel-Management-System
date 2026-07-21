import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { HotelTable } from "@/components/hotels/HotelTable"

/**
 * Hotels route.
 * Renders the shared DashboardLayout shell with the Hotel Booking module
 * (search, needs-booking filter, table/card views, add/edit/delete) as
 * its content.
 */
export default function HotelsPage() {
  return (
    <DashboardLayout title="Hotels" subtitle="Track bookings for every city on the route">
      <HotelTable />
    </DashboardLayout>
  )
}
