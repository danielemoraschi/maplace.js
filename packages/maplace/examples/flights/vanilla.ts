import type { LatLng, Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

// London's flights out, each an arc from the hub. A curve bows to the left of travel, a negative
// one to the right: the flights west take a negative one.
const london: LatLng = { lat: 51.5074, lng: -0.1278 };
const cities = [
  { id: "new-york", name: "New York", lat: 40.7128, lng: -74.006, curve: -0.2 },
  { id: "sao-paulo", name: "São Paulo", lat: -23.5505, lng: -46.6333, curve: -0.2 },
  { id: "cape-town", name: "Cape Town", lat: -33.9249, lng: 18.4241, curve: 0.2 },
  { id: "dubai", name: "Dubai", lat: 25.2048, lng: 55.2708, curve: 0.2 },
  { id: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777, curve: 0.2 },
  { id: "singapore", name: "Singapore", lat: 1.3521, lng: 103.8198, curve: 0.2 },
  { id: "tokyo", name: "Tokyo", lat: 35.6895, lng: 139.6917, curve: 0.2 },
  { id: "sydney", name: "Sydney", lat: -33.8688, lng: 151.2093, curve: 0.2 },
];
const flights: Location[] = [
  // The cities on the map only; the list holds the flights.
  { id: "london", ...london, title: "London", listed: false },
  ...cities.map(({ id, name, lat, lng }) => ({ id, lat, lng, title: name, listed: false })),
  ...cities.map(
    ({ id, name, lat, lng, curve }): Location => ({
      id: `london-${id}`,
      type: "polyline",
      title: `London → ${name}`,
      path: [london, { lat, lng }],
      curve,
      style: { stroke: "#2563eb" },
    }),
  ),
];
createGoogleMap("#flights-vanilla-map", {
  locations: flights,
  list: { container: "#flights-vanilla-list", heading: "Flights from London" },
});
