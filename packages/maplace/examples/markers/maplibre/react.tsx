import "maplibre-gl/dist/maplibre-gl.css";
import type { Location, MarkerLocation } from "@maplacejs/maplace";
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
    zoom: 8,
  },
  {
    id: "manchester",
    lat: 53.4808,
    lng: -2.2426,
    title: "Manchester",
  },
  { id: "cardiff", lat: 51.4816, lng: -3.1791, title: "Cardiff", data: { starred: true } },
];

/**
 * The map's pin for every marker without its own icon, Lucide's map-pin: ISC License,
 * © Lucide Contributors; portions © Cole Bemis (Feather, MIT); https://lucide.dev/license.
 */
function Pin() {
  return (
    <svg className="pin" viewBox="3 1 18 22" aria-hidden="true">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Outside the component, so a render of the page around it doesn't render every marker again.
// React's markerIcon is asked first: null leaves a marker its own icon.
const markerIcon = ({ data, icon }: MarkerLocation<City>) => {
  if (data?.starred) return <span className="star">★</span>;
  return icon === undefined ? <Pin /> : null;
};

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
