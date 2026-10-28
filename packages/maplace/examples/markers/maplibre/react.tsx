import "maplibre-gl/dist/maplibre-gl.css";
import type { LatLng, Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

/** Your own fields, in each location's `data`. */
interface City {
  readonly about?: string;
  readonly starred?: boolean;
}

const cities: Location<City>[] = [
  {
    id: "rome",
    lat: 41.9028,
    lng: 12.4964,
    title: "Rome",
    icon: "/icons/a.svg",
    data: { about: "Capital of Italy." },
  },
  {
    id: "milan",
    lat: 45.4642,
    lng: 9.19,
    title: "Milan",
    icon: "/icons/b.svg",
    zoom: 8,
    data: { about: "Finance and fashion." },
  },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples", icon: "/icons/c.svg" },
  { id: "venice", lat: 45.4408, lng: 12.3155, title: "Venice", data: { starred: true } },
  { id: "florence", lat: 43.7696, lng: 11.2558, title: "Florence", listed: false },
];

// Outside the component, so a render of the page around it doesn't render every marker again.
const popupContent = ({ data }: Location<City>) => (data?.about ? <p>{data.about}</p> : null);

const markerIcon = ({ data }: Location<City>) =>
  data?.starred ? <span className="star">★</span> : null;

/** The marker a click on the map drops, the `count`th. */
function droppedPin(position: LatLng, count: number): Location<City> {
  return { id: `dropped-${count}`, ...position, title: `Dropped pin ${count}` };
}

function Markers() {
  const [locations, setLocations] = useState(cities);
  // A click on the map drops a marker there.
  const dropPin = ({ position }: { readonly position: LatLng }) =>
    setLocations((current) => [
      ...current,
      droppedPin(position, current.length - cities.length + 1),
    ]);
  return (
    <MaplaceProvider locations={locations} onMapClick={dropPin}>
      <MaplaceMap
        createAdapter={createMapLibreAdapter}
        className="map"
        popupContent={popupContent}
        markerIcon={markerIcon}
      >
        <LocationList heading="Choose a location:" fitAllLabel="View all" position="top-right" />
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("markers-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Markers />
  </StrictMode>,
);
