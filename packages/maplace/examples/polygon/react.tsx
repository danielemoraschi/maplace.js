import type { Location } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own code, writing an edited location back to your server. */
declare function save(location: Location): Promise<void>;

const park: Location[] = [
  {
    id: "park",
    type: "polygon",
    title: "Hyde Park",
    editable: true,
    path: [
      { lat: 51.512, lng: -0.175 },
      { lat: 51.513, lng: -0.16 },
      { lat: 51.503, lng: -0.155 },
    ],
  },
];

function Polygon() {
  return (
    <MaplaceProvider locations={park} onLocationChange={({ location }) => void save(location)}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("polygon-react-root") as HTMLElement).render(
  <StrictMode>
    <Polygon />
  </StrictMode>,
);
