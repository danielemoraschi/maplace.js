import "maplibre-gl/dist/maplibre-gl.css";
import type { LatLng, Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// London's flights out, each along its great circle, the shortest way on the earth.
const london: LatLng = { lat: 51.5074, lng: -0.1278 };
const cities = [
  { id: "new-york", name: "New York", lat: 40.7128, lng: -74.006 },
  { id: "sao-paulo", name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { id: "cape-town", name: "Cape Town", lat: -33.9249, lng: 18.4241 },
  { id: "dubai", name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { id: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { id: "singapore", name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { id: "tokyo", name: "Tokyo", lat: 35.6895, lng: 139.6917 },
  { id: "sydney", name: "Sydney", lat: -33.8688, lng: 151.2093 },
];
const flights: Location[] = [
  // The cities on the map only; the list holds the flights.
  { id: "london", ...london, title: "London", listed: false },
  ...cities.map(({ id, name, lat, lng }) => ({ id, lat, lng, title: name, listed: false })),
  ...cities.map(
    ({ id, name, lat, lng }): Location => ({
      id: `london-${id}`,
      type: "polyline",
      title: `London → ${name}`,
      path: [london, { lat, lng }],
      geodesic: true,
      style: { stroke: "#2563eb" },
    }),
  ),
];

function Flights() {
  return (
    <MaplaceProvider locations={flights}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList heading="Flights from London" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("flights-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Flights />
  </StrictMode>,
);
