import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own fields, in each location's `data`. */
interface City {
  readonly about?: string;
  readonly starred?: boolean;
}

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

const locations: Location<City>[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", data: { about: "Capital of Italy." } },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", data: { starred: true } },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

// Outside the component, so a render of the page around it doesn't render every marker again.
const popupContent = ({ title, data }: Location<City>) =>
  data?.about ? (
    <>
      <strong>{title}</strong>
      <p>{data.about}</p>
    </>
  ) : null;

const markerIcon = ({ data }: Location<City>) => (data?.starred ? <span>★</span> : null);

function Markers() {
  return (
    <MaplaceProvider locations={locations}>
      <MaplaceMap
        createAdapter={createAdapter}
        className="map"
        popupContent={popupContent}
        markerIcon={markerIcon}
      />
      <LocationList />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("markers-react-root") as HTMLElement).render(
  <StrictMode>
    <Markers />
  </StrictMode>,
);
