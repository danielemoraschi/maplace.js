import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, MyLocation } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
  { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin" },
];

function Nearest() {
  return (
    <MaplaceProvider locations={cities}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map">
          <MyLocation />
        </MaplaceMap>
        <LocationList sort="distance" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("nearest-react-root") as HTMLElement).render(
  <StrictMode>
    <Nearest />
  </StrictMode>,
);
