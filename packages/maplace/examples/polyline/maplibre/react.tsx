import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const trail: Location[] = [
  // Cinque Terre's coastal path, Riomaggiore to Monterosso, through the villages between.
  // Editable: drag a point, or the middle of a segment.
  {
    id: "trail",
    type: "polyline",
    title: "Sentiero Azzurro",
    editable: true,
    path: [
      { lat: 44.0996, lng: 9.7377 },
      { lat: 44.1066, lng: 9.7285 },
      { lat: 44.1197, lng: 9.7103 },
      { lat: 44.1348, lng: 9.6847 },
      { lat: 44.1462, lng: 9.6548 },
    ],
  },
  {
    id: "manarola",
    lat: 44.1066,
    lng: 9.7285,
    title: "Manarola",
    content: "Its harbour, and the houses above it.",
  },
  {
    id: "corniglia",
    lat: 44.1197,
    lng: 9.7103,
    title: "Corniglia",
    content: "The village on the cliff top.",
  },
  {
    id: "vernazza",
    lat: 44.1348,
    lng: 9.6847,
    title: "Vernazza",
    content: "A harbour and its castle's tower.",
  },
];

function Polyline() {
  return (
    <MaplaceProvider locations={trail}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList heading="Along the trail" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("polyline-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Polyline />
  </StrictMode>,
);
