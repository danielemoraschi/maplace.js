// Compile-time checks of the React binding: each @ts-expect-error must stay an error.
import type {
  Geometry,
  LatLng,
  Location,
  LocationState,
  Maplace,
  MarkerLocation,
  RouteResult,
} from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { expectTypeOf } from "vitest";

const shops = [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }];

export const filters = (
  <>
    <MaplaceProvider locations={shops} filter={["North"]} />
    <MaplaceProvider locations={shops} filter={{ groups: ["North"], tags: ["parking"] }} />
    <MaplaceProvider locations={shops} filter={{ query: "rome" }} />
    {/* @ts-expect-error a filter's fields are groups and tags */}
    <MaplaceProvider locations={shops} filter={{ tag: ["parking"] }} />
  </>
);

export const typed = (
  <MaplaceProvider
    locations={shops}
    selectedId={undefined}
    route={{ stops: ["s", "u", "t"], via: ["u"], travelMode: "walking" }}
    onSelectionChange={({ id }) => expectTypeOf(id).toEqualTypeOf<string | undefined>()}
    onLocationChange={({ location }) =>
      expectTypeOf(location.data).toEqualTypeOf<{ price: number } | undefined>()
    }
    onLocationEdit={({ location, geometry }) => {
      expectTypeOf(location.data).toEqualTypeOf<{ price: number } | undefined>();
      expectTypeOf(geometry).toEqualTypeOf<Geometry>();
    }}
    onMapClick={({ position }) => expectTypeOf(position).toEqualTypeOf<LatLng>()}
    onRouteChange={({ result }) => expectTypeOf(result).toEqualTypeOf<RouteResult | undefined>()}
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

export const stateStyles = (
  <MaplaceProvider
    locations={[]}
    selectedStyle={{ fill: "red" }}
    hoveredStyle={{ strokeWidth: 3 }}
  />
);

// @ts-expect-error events are on + their name: there is no onClick
export const unknownEvent = <MaplaceProvider locations={shops} onClick={() => {}} />;
// @ts-expect-error locations are required, even when they load later: pass []
export const noLocations = <MaplaceProvider />;
const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
// @ts-expect-error an adapter factory, never an adapter instance
export const instance = <MaplaceMap createAdapter={adapter} />;
// @ts-expect-error an entry's content is React content, rendered by a function
export const staticContent = <LocationList>{"Shops"}</LocationList>;
export const headed = <LocationList heading="Choose a location:" />;
export const onTheMap = <LocationList position="top-right" />;
export const counted = <LocationList groupCounts />;
export const searched = (
  <LocationList searchLabel="Find" noMatchesLabel="None" matchesLabel="Hits" />
);
export const scoped = (
  <LocationList
    scope="viewport"
    areaOnlyLabel="Look here"
    showAllLabel="Everything"
    emptyAreaLabel="Nothing here"
  />
);
// @ts-expect-error a position is one of the map's corners
export const notACorner = <LocationList position="middle" />;
// @ts-expect-error a heading is text
export const headingNode = <LocationList heading={<h2>Shops</h2>} />;
// @ts-expect-error a list scopes to the map's view only
export const notAScope = <LocationList scope="world" />;

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

export const content = (
  <MaplaceMap<{ price: number }>
    createAdapter={createAdapter}
    popupContent={(location) => {
      expectTypeOf(location).toEqualTypeOf<Location<{ price: number }>>();
      return location.data && <p>{location.data.price}</p>;
    }}
    markerIcon={(location, state) => {
      expectTypeOf(location).toEqualTypeOf<MarkerLocation<{ price: number }>>();
      expectTypeOf(state).toEqualTypeOf<LocationState>();
      return state.selected ? <b>★</b> : null;
    }}
  />
);

const node = document.createElement("b");
export const nodeContent = (
  // @ts-expect-error content is React content: a DOM node is the core's `content`, not React's
  <MaplaceMap createAdapter={createAdapter} popupContent={() => node} />
);
