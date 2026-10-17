// A React page using maplace, type-checked against the packed package
// (scripts/checks/consumer-types.ts): React's types come from the page's own install.
import type { Location, LocationState } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const towns: Location<{ population: number }>[] = [
  { id: "rome", lat: 41.9, lng: 12.5, data: { population: 2_750_000 } },
];

type Town = Location<{ population: number }>;
const population = ({ data }: Town) => <p>{data?.population}</p>;
const star = (_: Town, { selected }: LocationState) => (selected ? <b>★</b> : null);

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
    <MaplaceProvider locations={towns} onSelectionChange={({ id }) => onPick(id)}>
      <MaplaceMap<{ population: number }>
        createAdapter={createAdapter}
        className="map"
        popupContent={population}
        markerIcon={star}
      />
      <LocationList<{ population: number }>>
        {({ location }) => `${location.id}: ${location.data?.population ?? 0}`}
      </LocationList>
      <Fit />
    </MaplaceProvider>
  );
}
