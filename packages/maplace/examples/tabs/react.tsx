import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { useState } from "react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Tabs({ locations }: { readonly locations: readonly Location[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  return (
    <MaplaceProvider locations={locations} onSelect={({ id }) => setSelectedId(id)}>
      <LocationList />
      <MaplaceMap createAdapter={createAdapter} />
      <aside>{selectedId}</aside>
    </MaplaceProvider>
  );
}
