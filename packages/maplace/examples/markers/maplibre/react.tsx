import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own field, in each location's `data`. */
interface City {
  readonly starred?: boolean;
}

const cities: Location<City>[] = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London", icon: "/examples/data/icons/a.svg" },
  {
    id: "edinburgh",
    lat: 55.9533,
    lng: -3.1883,
    title: "Edinburgh",
    icon: "/examples/data/icons/b.svg",
    zoom: 8,
  },
  {
    id: "manchester",
    lat: 53.4808,
    lng: -2.2426,
    title: "Manchester",
    icon: "/examples/data/icons/c.svg",
  },
  { id: "cardiff", lat: 51.4816, lng: -3.1791, title: "Cardiff", data: { starred: true } },
];

// Outside the component, so a render of the page around it doesn't render every marker again.
const markerIcon = ({ data }: Location<City>) =>
  data?.starred ? <span className="star">★</span> : null;

function Markers() {
  return (
    <MaplaceProvider locations={cities}>
      <MaplaceMap createAdapter={createMapLibreAdapter} className="map" markerIcon={markerIcon} />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("markers-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Markers />
  </StrictMode>,
);
