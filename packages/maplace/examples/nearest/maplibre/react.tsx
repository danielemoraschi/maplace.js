import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider, MyLocation } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London" },
  { id: "bristol", lat: 51.4545, lng: -2.5879, title: "Bristol" },
  { id: "birmingham", lat: 52.4862, lng: -1.8904, title: "Birmingham" },
  { id: "manchester", lat: 53.4808, lng: -2.2426, title: "Manchester" },
  { id: "leeds", lat: 53.8008, lng: -1.5491, title: "Leeds" },
];

function Nearest() {
  return (
    <MaplaceProvider locations={cities}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map">
          <MyLocation />
        </MaplaceMap>
        <LocationList sort="distance" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("nearest-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Nearest />
  </StrictMode>,
);
