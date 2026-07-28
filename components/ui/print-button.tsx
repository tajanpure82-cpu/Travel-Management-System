"use client"

/**
 * PrintButton
 * ─────────────────────────────────────────────────────────────────────────
 * Reusable print trigger — calls the browser's native window.print(),
 * which combined with app/print.css and the `print:hidden` classes
 * applied to toolbars/action buttons in each page, produces a clean
 * printed page without any custom PDF-generation library. The button
 * itself is print:hidden — it has no reason to appear on the printed
 * page it triggers.
 *
 * Drop this into any module's toolbar to get the same behavior there;
 * the hard infrastructure work (print.css, DashboardLayout's sidebar/
 * header hiding) is already done app-wide.
 */

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface PrintButtonProps {
  label?: string
}

export function PrintButton({ label = "Print" }: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  )
}
