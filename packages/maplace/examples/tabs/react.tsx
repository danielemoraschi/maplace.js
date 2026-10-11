// Draft: becomes `maplace/react` in 1.x.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { useState } from "react";
import { LocationList, MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Tabs({ locations }: { locations: readonly Location[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  return (
    <MaplaceProvider locations={locations} onSelect={({ id }) => setSelectedId(id)}>
      <LocationList />
      <MaplaceMap adapter={adapter} />
      <aside>{selectedId}</aside>
    </MaplaceProvider>
  );
}
