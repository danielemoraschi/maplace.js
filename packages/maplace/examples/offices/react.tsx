import type { Location } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function Offices() {
  // Each office in a region and a country: a group path, outermost first.
  const [offices, setOffices] = useState<readonly Location[]>([]);
  useEffect(() => {
    fetch("/examples/data/offices.json")
      .then((response) => response.json())
      .then(setOffices);
  }, []);
  return (
    <MaplaceProvider locations={offices}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
        <LocationList
          heading="Offices"
          groupCounts
          groupFilter
          search
          searchLabel="Find an office"
        />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("offices-react-root") as HTMLElement).render(
  <StrictMode>
    <Offices />
  </StrictMode>,
);
