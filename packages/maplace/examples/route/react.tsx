import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { useState } from "react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Route({ locations }: { readonly locations: readonly Location[] }) {
  const [distanceKm, setDistanceKm] = useState<number>();
  const stops = locations.map((location) => location.id);
  return (
    <MaplaceProvider
      locations={locations}
      route={{ stops, travelMode: "driving" }}
      onRoute={({ result }) => setDistanceKm(result && Math.round(result.distanceMeters / 1000))}
    >
      <MaplaceMap createAdapter={createAdapter} />
      <LocationList />
      {distanceKm !== undefined && <p>{distanceKm} km</p>}
    </MaplaceProvider>
  );
}
