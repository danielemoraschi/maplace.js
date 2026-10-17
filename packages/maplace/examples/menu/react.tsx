import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Menu({ locations }: { readonly locations: readonly Location[] }) {
  return (
    <MaplaceProvider locations={locations}>
      <LocationList as="select" fitAllLabel="All cities" />
      <MaplaceMap createAdapter={createAdapter} className="map" />
    </MaplaceProvider>
  );
}
