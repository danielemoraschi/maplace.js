import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Menu({ locations }: { locations: readonly Location[] }) {
  return (
    <MaplaceProvider locations={locations}>
      <LocationList as="select" />
      <MaplaceMap createAdapter={createAdapter} />
    </MaplaceProvider>
  );
}
