import "maplibre-gl/dist/maplibre-gl.css";
import { type LatLng, type Location, type PolylineLocation, pointAlong } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

// London's flights out, each along its great circle, the shortest way on the earth, the ones
// still scheduled dashed. The flight to New York is in the air: drawn active, travelled as far as
// the slider says, with its plane there.
const london: LatLng = { lat: 51.5074, lng: -0.1278 };
const newYork = { id: "new-york", name: "New York", lat: 40.7128, lng: -74.006 };
const cities = [
  newYork,
  { id: "sao-paulo", name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { id: "cape-town", name: "Cape Town", lat: -33.9249, lng: 18.4241 },
  { id: "dubai", name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { id: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { id: "singapore", name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { id: "tokyo", name: "Tokyo", lat: 35.6895, lng: 139.6917 },
  { id: "sydney", name: "Sydney", lat: -33.8688, lng: 151.2093 },
];
const scheduled = new Set(["cape-town", "sydney"]);
/** A plane, nose up, as an image. */
const plane =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Cpath fill='%231d4ed8' stroke='white' d='M12 2l1.5 7 8.5 4v2l-8.5-2.5-.5 5.5 2.5 2v1.5l-3.5-1-3.5 1V20l2.5-2-.5-5.5L2 15v-2l8.5-4z'/%3E%3C/svg%3E";

function flightTo({ id, name, lat, lng }: typeof newYork): PolylineLocation {
  return {
    id: `london-${id}`,
    type: "polyline",
    title: `London → ${name}`,
    path: [london, { lat, lng }],
    geodesic: true,
    style: scheduled.has(id) ? { stroke: "#2563eb", strokeDash: "dashed" } : { stroke: "#2563eb" },
  };
}

// Made once, so a move of the slider changes only the flight in the air and its plane.
const places: Location[] = [
  // The cities and the plane on the map only; the list holds the flights.
  { id: "london", ...london, title: "London", listed: false },
  ...cities.map(({ id, name, lat, lng }) => ({ id, lat, lng, title: name, listed: false })),
];
const toNewYork = flightTo(newYork);
const otherFlights = cities.slice(1).map(flightTo);

/** The map's locations, the flight to New York `flown` (0 to 1) of the way there. */
function flightsWith(flown: number): Location[] {
  const inTheAir: PolylineLocation = { ...toNewYork, active: true, progress: flown };
  const at = pointAlong(inTheAir, flown);
  const planeThere = {
    id: "plane",
    ...at,
    title: "The plane to New York",
    icon: plane,
    listed: false,
  };
  return [...places, inTheAir, ...otherFlights, planeThere];
}

// The earth as a globe, with a toggle on the map to flatten it.
const onTheGlobe = () => createMapLibreAdapter({ globe: true });

function Flights() {
  const [flown, setFlown] = useState(0.4);
  const flights = useMemo(() => flightsWith(flown), [flown]);
  return (
    <MaplaceProvider locations={flights}>
      <label className="flown">
        London → New York, flown{" "}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={flown}
          onChange={(event) => setFlown(event.target.valueAsNumber)}
        />
      </label>
      <div className="map-and-list">
        <MaplaceMap createAdapter={onTheGlobe} className="map" />
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
