// Draft: becomes `maplace/react` in 1.x.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { useEffect, useState } from "react";
import { LocationList, MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Mixed() {
  const [locations, setLocations] = useState<readonly Location[]>([]);
  useEffect(() => {
    fetch("/locations.json")
      .then((response) => response.json())
      .then(setLocations);
  }, []);
  return (
    <MaplaceProvider locations={locations}>
      <MaplaceMap adapter={adapter} />
      <LocationList />
    </MaplaceProvider>
  );
}
