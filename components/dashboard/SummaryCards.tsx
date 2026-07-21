export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-xl border p-6">
        <h3 className="font-semibold">Current City</h3>
        <p>Nashik</p>
      </div>

      <div className="rounded-xl border p-6">
        <h3 className="font-semibold">Destination</h3>
        <p>Raipur</p>
      </div>

      <div className="rounded-xl border p-6">
        <h3 className="font-semibold">Budget</h3>
        <p>₹0</p>
      </div>

      <div className="rounded-xl border p-6">
        <h3 className="font-semibold">Driver</h3>
        <p>Not Assigned</p>
      </div>
    </div>
  )
}