// Draft: becomes `maplace/react` in 1.x.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "../../src/react/index";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Polygon(props: { park: Location; onSave: (location: Location) => void }) {
  return (
    <MaplaceProvider locations={[props.park]} onChange={({ location }) => props.onSave(location)}>
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
