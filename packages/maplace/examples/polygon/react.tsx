import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export function Polygon(props: {
  readonly locations: readonly Location[];
  readonly onSave: (location: Location) => void;
}) {
  return (
    <MaplaceProvider
      locations={props.locations}
      onChange={({ location }) => props.onSave(location)}
    >
      <MaplaceMap createAdapter={createAdapter} />
    </MaplaceProvider>
  );
}
