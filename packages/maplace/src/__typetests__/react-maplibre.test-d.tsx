// Compile-time checks of the React binding on MapLibre: each @ts-expect-error must stay an error.
import type { Location, LocationState } from "maplace";
import { createMapLibreAdapter, createMapLibreMap } from "maplace/maplibre";
import { MaplaceMap } from "maplace/react";

type Shop = Location<{ price: number }>;

export const factory = <MaplaceMap createAdapter={createMapLibreAdapter} />;

export const withOptions = (
  <MaplaceMap<{ price: number }>
    createAdapter={() => createMapLibreAdapter({ mapStyle: "https://tiles.example/style.json" })}
    popupContent={({ data }: Shop) => <p>{data?.price}</p>}
    markerIcon={(_: Shop, { selected }: LocationState) => (selected ? <b>★</b> : null)}
  />
);

// @ts-expect-error the shortcut makes a store on its own map, not an adapter
export const shortcut = <MaplaceMap createAdapter={createMapLibreMap} />;
