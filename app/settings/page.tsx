import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SettingsForm } from "@/components/settings/SettingsForm"

/**
 * Settings route.
 * Renders the shared DashboardLayout shell with the Settings form as its
 * content. Settings is a singleton form, not a list-based module — see
 * SettingsForm.tsx for why.
 */
export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings" subtitle="Trip-wide preferences">
      <SettingsForm />
    </DashboardLayout>
  )
}
