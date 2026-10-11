import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Markers({ locations }: { locations: readonly Location[] }) {
  return (
    <MaplaceProvider locations={locations}>
      <MaplaceMap adapter={adapter} />
      <LocationList />
    </MaplaceProvider>
  );
}
