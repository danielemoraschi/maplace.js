import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

function Mixed() {
  const [locations, setLocations] = useState<readonly Location[]>([]);
  useEffect(() => {
    fetch("/locations.json")
      .then((response) => response.json())
      .then(setLocations);
  }, []);
  return (
    <MaplaceProvider locations={locations}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
      <LocationList />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("mixed-react-root") as HTMLElement).render(
  <StrictMode>
    <Mixed />
  </StrictMode>,
);
