import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { useState } from "react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Route({ locations }: { locations: readonly Location[] }) {
  const [km, setKm] = useState<number>();
  const stops = locations.map((location) => location.id);
  return (
    <MaplaceProvider
      locations={locations}
      route={{ stops, travelMode: "driving" }}
      onRoute={({ result }) => setKm(result && Math.round(result.distanceMeters / 1000))}
    >
      <MaplaceMap createAdapter={createAdapter} />
      <LocationList />
      {km !== undefined && <p>{km} km</p>}
    </MaplaceProvider>
  );
}
