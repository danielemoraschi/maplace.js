// A React page using maplace, type-checked against the packed package
// (scripts/checks/consumer-types.ts): React's types come from the page's own install.
import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const towns: Location<{ population: number }>[] = [
  { id: "rome", lat: 41.9, lng: 12.5, data: { population: 2_750_000 } },
];

function Fit() {
  const maplace = useMaplace();
  return (
    <button type="button" onClick={() => maplace.fitAll()}>
      Fit all
    </button>
  );
}

export function Towns({ onPick }: { readonly onPick: (id: string | undefined) => void }) {
  return (
    <MaplaceProvider locations={towns} onSelect={({ id }) => onPick(id)}>
      <MaplaceMap createAdapter={createAdapter} className="map" />
      <LocationList<{ population: number }>>
        {({ location }) => `${location.id}: ${location.data?.population ?? 0}`}
      </LocationList>
      <Fit />
    </MaplaceProvider>
  );
}
