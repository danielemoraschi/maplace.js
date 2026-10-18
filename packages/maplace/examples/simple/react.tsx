import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const rome: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];

function Simple() {
  return (
    <MaplaceProvider locations={rome}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("simple-react-root") as HTMLElement).render(
  <StrictMode>
    <Simple />
  </StrictMode>,
);
