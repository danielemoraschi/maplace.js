import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own field, in each location's `data`. */
interface City {
  readonly starred?: boolean;
}

const cities: Location<City>[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", icon: "/icons/a.svg" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", icon: "/icons/b.svg", zoom: 8 },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples", icon: "/icons/c.svg" },
  { id: "venice", lat: 45.4408, lng: 12.3155, title: "Venice", data: { starred: true } },
];

// Outside the component, so a render of the page around it doesn't render every marker again.
const markerIcon = ({ data }: Location<City>) =>
  data?.starred ? <span className="star">★</span> : null;

function Markers() {
  return (
    <MaplaceProvider locations={cities}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" markerIcon={markerIcon} />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("markers-react-root") as HTMLElement).render(
  <StrictMode>
    <Markers />
  </StrictMode>,
);
