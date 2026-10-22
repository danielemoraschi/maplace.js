import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own code, writing an edited location back to your server. */
declare function save(location: Location): Promise<void>;

const park: Location[] = [
  {
    id: "park",
    type: "polygon",
    title: "Park",
    editable: true,
    path: [
      { lat: 41.91, lng: 12.48 },
      { lat: 41.92, lng: 12.49 },
      { lat: 41.9, lng: 12.5 },
    ],
  },
];

function Polygon() {
  return (
    <MaplaceProvider locations={park} onLocationChange={({ location }) => void save(location)}>
      <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("polygon-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Polygon />
  </StrictMode>,
);
