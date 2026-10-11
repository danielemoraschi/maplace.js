// Draft: becomes `maplace/react` in 1.x.
import type { LatLng } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Polyline({ path }: { path: readonly LatLng[] }) {
  return (
    <MaplaceProvider locations={[{ id: "trail", type: "polyline", title: "Coast trail", path }]}>
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
