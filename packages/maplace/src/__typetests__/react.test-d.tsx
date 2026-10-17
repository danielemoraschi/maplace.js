// Compile-time checks of the React binding: each @ts-expect-error must stay an error.
import type { Maplace, RouteResult } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { expectTypeOf } from "vitest";

const shops = [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }];

export const typed = (
  <MaplaceProvider
    locations={shops}
    selectedId={undefined}
    route={{ stops: ["s", "t"], travelMode: "walking" }}
    onSelect={({ id }) => expectTypeOf(id).toEqualTypeOf<string | undefined>()}
    onChange={({ location }) =>
      expectTypeOf(location.data).toEqualTypeOf<{ price: number } | undefined>()
    }
    onRoute={({ result }) => expectTypeOf(result).toEqualTypeOf<RouteResult | undefined>()}
    onPopupOpen={({ element }) => expectTypeOf(element).toEqualTypeOf<HTMLElement>()}
  >
    <MaplaceMap createAdapter={() => createGoogleAdapter({ mapId: "DEMO_MAP_ID" })} />
    <LocationList<{ price: number }> label="Shops">
      {({ location, selected }) => `${location.data?.price} ${selected}`}
    </LocationList>
  </MaplaceProvider>
);

export function Shops() {
  expectTypeOf(useMaplace<{ price: number }>()).toEqualTypeOf<Maplace<{ price: number }>>();
  return null;
}

// @ts-expect-error events are on + their name: there is no onClick
export const unknownEvent = <MaplaceProvider locations={shops} onClick={() => {}} />;
// @ts-expect-error locations are required, even when they load later: pass []
export const noLocations = <MaplaceProvider />;
const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
// @ts-expect-error an adapter factory, never an adapter instance
export const instance = <MaplaceMap createAdapter={adapter} />;
// @ts-expect-error an entry's content is React content, rendered by a function
export const staticContent = <LocationList>{"Shops"}</LocationList>;
