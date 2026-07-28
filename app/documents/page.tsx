import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { DocumentTable } from "@/components/documents/DocumentTable"

/**
 * Documents route.
 * Renders the shared DashboardLayout shell with the Document Tracker
 * module (search, needs-attention filter, table/card views, add/edit/
 * delete) as its content.
 */
export default function DocumentsPage() {
  return (
    <DashboardLayout
      title="Documents"
      subtitle="Track RC, insurance, permits, and travel documents"
    >
      <DocumentTable />
    </DashboardLayout>
  )
}
