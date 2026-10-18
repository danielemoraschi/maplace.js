import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const center = { lat: 41.9028, lng: 12.4964 };
const selectedStyle = { stroke: "#c2410c", fill: "#f97316" };
const circles: Location[] = [
  { id: "center", type: "circle", center, radius: 5_000, title: "Within 5 km", selectedStyle },
  { id: "ring", type: "circle", center, radius: 15_000, title: "Within 15 km", selectedStyle },
];

function Circles() {
  return (
    <MaplaceProvider locations={circles}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
      <LocationList />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("circles-react-root") as HTMLElement).render(
  <StrictMode>
    <Circles />
  </StrictMode>,
);
