// Draft: becomes `maplace/react` in 1.x.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Menu({ locations }: { locations: readonly Location[] }) {
  return (
    <MaplaceProvider locations={locations}>
      <LocationList as="select" />
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
