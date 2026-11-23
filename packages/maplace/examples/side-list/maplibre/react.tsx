import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", group: "North" },
  { id: "glasgow", lat: 55.8642, lng: -4.2518, title: "Glasgow", group: "North" },
  { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast", group: "North" },
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London", group: "South" },
  { id: "bristol", lat: 51.4545, lng: -2.5879, title: "Bristol", group: "South" },
  { id: "cardiff", lat: 51.4816, lng: -3.1791, title: "Cardiff", group: "South" },
];

function SideList() {
  return (
    <MaplaceProvider locations={cities}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
        <LocationList heading="Cities" fitAll fitAllLabel="All cities" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("side-list-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <SideList />
  </StrictMode>,
);
