import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const london: Location[] = [{ id: "london", lat: 51.5074, lng: -0.1278, title: "London" }];

function Simple() {
  return (
    <MaplaceProvider locations={london}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("simple-react-root") as HTMLElement).render(
  <StrictMode>
    <Simple />
  </StrictMode>,
);
