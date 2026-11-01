import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own field, in each location's `data`. */
interface City {
  readonly about?: string;
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
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

// Outside the component, so a render of the page around it doesn't render every popup again.
const popupContent = ({ data }: Location<City>) => (data?.about ? <p>{data.about}</p> : null);

const popup = { openInMapsLink: true, directionsLink: true };

function Popups() {
  return (
    <MaplaceProvider locations={cities} popup={popup}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" popupContent={popupContent} />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("popups-react-root") as HTMLElement).render(
  <StrictMode>
    <Popups />
  </StrictMode>,
);
