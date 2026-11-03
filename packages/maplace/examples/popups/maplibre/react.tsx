import "maplibre-gl/dist/maplibre-gl.css";
import type { Location, View } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own field, in each location's `data`. */
interface City {
  readonly about: string;
  readonly facts?: readonly string[];
}

const cities: Location<City>[] = [
  {
    id: "rome",
    lat: 41.9028,
    lng: 12.4964,
    title: "Rome",
    data: { about: "Capital of Italy." },
  },
  {
    id: "milan",
    lat: 45.4642,
    lng: 9.19,
    title: "Milan",
    data: { about: "Finance and fashion." },
  },
  {
    id: "venice",
    lat: 45.4408,
    lng: 12.3155,
    title: "Venice",
    data: { about: "A city on 118 islands.", facts: ["Over 400 bridges", "No cars, only boats"] },
  },
];

// Outside the component, so a render of the page around it doesn't render every popup again.
const popupContent = ({ data }: Location<City>) => (
  <>
    <p>{data?.about}</p>
    {data?.facts && (
      <ul>
        {data.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    )}
  </>
);

const popup = { openInMapsLink: true, directionsLink: true };

const firstView: View = { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 };

function Popups() {
  return (
    <MaplaceProvider view={firstView} locations={cities} popup={popup}>
      <MaplaceMap
        createAdapter={createMapLibreAdapter}
        className="map"
        popupContent={popupContent}
      />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("popups-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Popups />
  </StrictMode>,
);
