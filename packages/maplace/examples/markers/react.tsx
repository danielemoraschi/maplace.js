import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Markers({ locations }: { readonly locations: readonly Location[] }) {
  return (
    <MaplaceProvider locations={locations}>
      <MaplaceMap createAdapter={createAdapter} />
      <LocationList />
    </MaplaceProvider>
  );
}
