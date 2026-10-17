import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { useEffect, useState } from "react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Mixed() {
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
