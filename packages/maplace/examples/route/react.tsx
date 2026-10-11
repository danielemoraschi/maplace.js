// Draft: becomes `maplace/react` in 1.x.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Route({ locations }: { locations: readonly Location[] }) {
  const stops = locations.map((location) => location.id);
  return (
    <MaplaceProvider locations={locations} route={{ stops, travelMode: "driving" }}>
      <MaplaceMap adapter={adapter} />
      <LocationList />
    </MaplaceProvider>
  );
}
