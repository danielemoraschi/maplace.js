// Draft: becomes `maplace/react` in 1.x.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Big({ points }: { points: readonly Location[] }) {
  return (
    <MaplaceProvider locations={points} cluster>
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
