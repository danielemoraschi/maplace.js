import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

/** `trail` is a polyline location, e.g. `{ id, type: "polyline", title, path }`. */
export function Polyline({ trail }: { trail: readonly Location[] }) {
  return (
    <MaplaceProvider locations={trail}>
      <MaplaceMap createAdapter={createAdapter} />
    </MaplaceProvider>
  );
}
