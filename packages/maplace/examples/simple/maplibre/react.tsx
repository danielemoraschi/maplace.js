import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rome: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];

function Simple() {
  return (
    <MaplaceProvider locations={rome}>
      <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("simple-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Simple />
  </StrictMode>,
);
