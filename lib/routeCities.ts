/**
 * routeCities
 * ─────────────────────────────────────────────────────────────────────────
 * Real-world coordinates for the cities on this trip's already-planned
 * route (Nashik → Nagpur → Raipur → Puri → Konark → Kharagpur →
 * Muzaffarpur → Raxaul → Kathmandu → Manakamana → Pokhara → Lumbini →
 * Sunauli → Prayagraj → Jabalpur → Nagpur → Nashik). Lets the Add/Edit
 * Timeline dialog offer a "pick a known city" shortcut that auto-fills
 * latitude/longitude, instead of requiring anyone to manually look up
 * coordinates for a route that's already fixed and known.
 *
 * Coordinates are reasonable city-center approximations — accurate
 * enough for a route-overview map, not survey-grade precision.
 */

export interface RouteCity {
  name: string
  latitude: number
  longitude: number
}

export const ROUTE_CITIES: RouteCity[] = [
  { name: "Nashik", latitude: 19.9975, longitude: 73.7898 },
  { name: "Nagpur", latitude: 21.1458, longitude: 79.0882 },
  { name: "Raipur", latitude: 21.2514, longitude: 81.6296 },
  { name: "Puri", latitude: 19.8135, longitude: 85.8312 },
  { name: "Konark", latitude: 19.8876, longitude: 86.0945 },
  { name: "Kharagpur", latitude: 22.346, longitude: 87.232 },
  { name: "Muzaffarpur", latitude: 26.1209, longitude: 85.3647 },
  { name: "Raxaul (border)", latitude: 26.977, longitude: 84.853 },
  { name: "Kathmandu", latitude: 27.7172, longitude: 85.324 },
  { name: "Manakamana", latitude: 27.9411, longitude: 84.7047 },
  { name: "Pokhara", latitude: 28.2096, longitude: 83.9856 },
  { name: "Lumbini", latitude: 27.4833, longitude: 83.2767 },
  { name: "Sunauli (border)", latitude: 27.4833, longitude: 83.4419 },
  { name: "Prayagraj", latitude: 25.4358, longitude: 81.8463 },
  { name: "Jabalpur", latitude: 23.1815, longitude: 79.9864 },
]
