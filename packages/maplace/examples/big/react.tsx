import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Big({ points }: { readonly points: readonly Location[] }) {
  return (
    <MaplaceProvider locations={points} cluster>
      <MaplaceMap createAdapter={createAdapter} />
    </MaplaceProvider>
  );
}
