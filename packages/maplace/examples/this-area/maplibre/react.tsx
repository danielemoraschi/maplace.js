import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const capitals: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "madrid", lat: 40.4168, lng: -3.7038, title: "Madrid" },
  { id: "paris", lat: 48.8566, lng: 2.3522, title: "Paris" },
  { id: "brussels", lat: 50.8503, lng: 4.3517, title: "Brussels" },
  { id: "amsterdam", lat: 52.3676, lng: 4.9041, title: "Amsterdam" },
  { id: "berlin", lat: 52.52, lng: 13.405, title: "Berlin" },
  { id: "copenhagen", lat: 55.6761, lng: 12.5683, title: "Copenhagen" },
  { id: "vienna", lat: 48.2082, lng: 16.3738, title: "Vienna" },
  { id: "prague", lat: 50.0755, lng: 14.4378, title: "Prague" },
  { id: "warsaw", lat: 52.2297, lng: 21.0122, title: "Warsaw" },
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "athens", lat: 37.9838, lng: 23.7275, title: "Athens" },
];

function ThisArea() {
  return (
    <MaplaceProvider locations={capitals}>
      <MaplaceMap createAdapter={createMapLibreAdapter} className="map">
        {/* A list switched between "All" and "This area", what is in view as the map moves. */}
        <LocationList scope="viewport" position="top-right" />
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("this-area-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <ThisArea />
  </StrictMode>,
);
