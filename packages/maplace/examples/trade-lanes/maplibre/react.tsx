import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Sea and air lanes, each coloured by its mode. The volumes are made up, for the example.
// A curve bows each lane for the look: to the left of travel, to the right when negative.
const colours: Record<string, string> = { Sea: "#0f766e", Air: "#7c3aed" };
const routes = [
  {
    id: "shanghai-los-angeles",
    title: "Shanghai → Los Angeles",
    mode: "Sea",
    from: { lat: 31.2304, lng: 121.4737 },
    to: { lat: 34.0522, lng: -118.2437 },
    curve: 0.2,
    volume: "24,800 TEU a week",
  },
  {
    id: "singapore-rotterdam",
    title: "Singapore → Rotterdam",
    mode: "Sea",
    from: { lat: 1.3521, lng: 103.8198 },
    to: { lat: 51.9244, lng: 4.4777 },
    curve: 0.2,
    volume: "9,400 TEU a week",
  },
  {
    id: "rotterdam-new-york",
    title: "Rotterdam → New York",
    mode: "Sea",
    from: { lat: 51.9244, lng: 4.4777 },
    to: { lat: 40.7128, lng: -74.006 },
    curve: -0.2,
    volume: "3,100 TEU a week",
  },
  {
    id: "hong-kong-anchorage",
    title: "Hong Kong → Anchorage",
    mode: "Air",
    from: { lat: 22.3193, lng: 114.1694 },
    to: { lat: 61.2181, lng: -149.9003 },
    curve: 0.2,
    volume: "1,500 t a week",
  },
  {
    id: "frankfurt-chicago",
    title: "Frankfurt → Chicago",
    mode: "Air",
    from: { lat: 50.1109, lng: 8.6821 },
    to: { lat: 41.8781, lng: -87.6298 },
    curve: -0.2,
    volume: "820 t a week",
  },
  {
    id: "dubai-nairobi",
    title: "Dubai → Nairobi",
    mode: "Air",
    from: { lat: 25.2048, lng: 55.2708 },
    to: { lat: -1.2921, lng: 36.8219 },
    curve: 0.2,
    volume: "310 t a week",
  },
];
const lanes: Location[] = routes.map(
  ({ id, title, mode, from, to, curve, volume }): Location => ({
    id,
    type: "polyline",
    title,
    group: mode,
    path: [from, to],
    curve,
    style: { stroke: colours[mode] },
    hoveredStyle: { strokeWidth: 5 },
    selectedStyle: { strokeWidth: 6 },
    content: volume,
  }),
);

function TradeLanes() {
  return (
    <MaplaceProvider locations={lanes}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList heading="Trade lanes" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("trade-lanes-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <TradeLanes />
  </StrictMode>,
);
