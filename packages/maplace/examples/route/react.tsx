import type { Location, Route as MaplaceRoute } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const cities: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna" },
  { id: "florence", lat: 43.7696, lng: 11.2558, title: "Florence" },
];
const ROUTE: MaplaceRoute = { stops: ["milan", "bologna", "florence"], travelMode: "driving" };

function Route() {
  const [distance, setDistance] = useState("");
  return (
    <MaplaceProvider
      locations={cities}
      route={ROUTE}
      onRouteChange={({ result }) =>
        setDistance(result ? `${Math.round(result.distanceMeters / 1000)} km` : "")
      }
    >
      <MaplaceMap createAdapter={createAdapter} className="map" />
      <LocationList />
      <output>{distance}</output>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("route-react-root") as HTMLElement).render(
  <StrictMode>
    <Route />
  </StrictMode>,
);
