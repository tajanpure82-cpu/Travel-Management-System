"use client"

/**
 * RouteMap
 * ─────────────────────────────────────────────────────────────────────────
 * Plots this trip's route using Leaflet + OpenStreetMap — free, no API
 * key, no billing account, unlike Google Maps. Shows a marker for every
 * Timeline entry that has a location set, connected by a line in day
 * order, with a popup on each marker showing which leg it is.
 *
 * "Changing the destination during travel" doesn't need anything new
 * here — editing a Timeline entry's location (or adding a new one)
 * updates this map automatically the next time it renders, same as
 * every other live-subscribed view in this app.
 *
 * Imported via next/dynamic with ssr:false wherever this is used —
 * Leaflet touches `window`/the DOM at module load time, which doesn't
 * exist during Next.js's server-side render pass.
 *
 * The icon-fix block below is a well-known, necessary workaround:
 * Leaflet's default marker icons reference image paths in a way that
 * breaks under bundlers like Next.js/webpack unless explicitly
 * reconfigured to load from a CDN instead. `_getIconUrl` isn't part of
 * Leaflet's public type definitions (it's a private-by-convention
 * internal), so removing it needs an explicit, narrow cast — done via
 * `unknown` rather than `any`, naming exactly the one property being
 * touched.
 */

import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import type { TimelineEntry } from "@/types/timeline"

interface LeafletIconDefaultPrototype {
  _getIconUrl?: () => string
}

delete (L.Icon.Default.prototype as unknown as LeafletIconDefaultPrototype)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface RouteMapProps {
  entries: TimelineEntry[]
}

type LocatedEntry = TimelineEntry & { latitude: number; longitude: number }

/** Ascending by day, entries with no day set sort to the end — same
 *  ordering rule as everywhere else Timeline entries are displayed. */
function sortByDay(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.day === null && b.day === null) return 0
    if (a.day === null) return 1
    if (b.day === null) return -1
    return a.day - b.day
  })
}

export function RouteMap({ entries }: RouteMapProps) {
  const located = sortByDay(entries).filter(
    (entry): entry is LocatedEntry => entry.latitude !== null && entry.longitude !== null
  )

  if (located.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No legs have a location set yet. Edit a leg, pick a known city from the Location
        dropdown, and it'll appear here.
      </div>
    )
  }

  const positions: [number, number][] = located.map((entry) => [
    entry.latitude,
    entry.longitude,
  ])
  const center = positions[Math.floor(positions.length / 2)]

  return (
    <div className="h-80 overflow-hidden rounded-md border border-border">
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#2563eb" weight={3} />
        {located.map((entry) => (
          <Marker key={entry.id} position={[entry.latitude, entry.longitude]}>
            <Popup>
              <strong>
                {entry.day !== null ? `Day ${entry.day}: ` : ""}
                {entry.title}
              </strong>
              <br />
              {entry.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
