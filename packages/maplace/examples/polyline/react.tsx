import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const trail: Location[] = [
  {
    id: "trail",
    type: "polyline",
    title: "Coast trail",
    path: [
      { lat: 44.1, lng: 9.72 },
      { lat: 44.13, lng: 9.68 },
      { lat: 44.14, lng: 9.65 },
    ],
  },
];

function Polyline() {
  return (
    <MaplaceProvider locations={trail}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("polyline-react-root") as HTMLElement).render(
  <StrictMode>
    <Polyline />
  </StrictMode>,
);
