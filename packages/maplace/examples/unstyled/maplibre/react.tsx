import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own field, in each location's `data`: a line about the place. */
interface City {
  readonly about: string;
}

const cities: Location<City>[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", data: { about: "Capital of Italy." } },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", data: { about: "Finance and fashion." } },
  {
    id: "naples",
    lat: 40.8518,
    lng: 14.2681,
    title: "Naples",
    data: { about: "Pizza's home town." },
  },
  { id: "venice", lat: 45.4408, lng: 12.3155, title: "Venice", data: { about: "Built on water." } },
];

// Outside the component, so a render of the page around it doesn't render every popup again.
const popupContent = ({ data }: Location<City>) => <p>{data?.about}</p>;

function Unstyled() {
  return (
    <MaplaceProvider locations={cities}>
      {/* maplace's own styles are off inside: the page's CSS draws the map, the list and the popups' text. */}
      <div className="map-and-list" data-maplace-unstyled="">
        <MaplaceMap
          createAdapter={createMapLibreAdapter}
          className="map"
          popupContent={popupContent}
        />
        <LocationList />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("unstyled-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Unstyled />
  </StrictMode>,
);
