import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";

const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Polygon(props: {
  locations: readonly Location[];
  onSave: (location: Location) => void;
}) {
  return (
    <MaplaceProvider
      locations={props.locations}
      onChange={({ location }) => props.onSave(location)}
    >
      <MaplaceMap adapter={adapter} />
    </MaplaceProvider>
  );
}
