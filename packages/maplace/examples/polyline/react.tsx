import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const trail: Location[] = [
  // Editable: drag a point, or the middle of a segment.
  {
    id: "trail",
    type: "polyline",
    title: "Coast trail",
    editable: true,
    path: [
      { lat: 44.1, lng: 9.72 },
      { lat: 44.13, lng: 9.68 },
      { lat: 44.14, lng: 9.65 },
    ],
  },
  {
    id: "lighthouse",
    lat: 44.104,
    lng: 9.712,
    title: "Lighthouse",
    content: "A lighthouse on the point.",
  },
  { id: "chapel", lat: 44.128, lng: 9.685, title: "Chapel", content: "A chapel above the sea." },
  { id: "lookout", lat: 44.138, lng: 9.657, title: "Lookout", content: "The view over the bay." },
];

function Polyline() {
  return (
    <MaplaceProvider locations={trail}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
      <LocationList />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("polyline-react-root") as HTMLElement).render(
  <StrictMode>
    <Polyline />
  </StrictMode>,
);
