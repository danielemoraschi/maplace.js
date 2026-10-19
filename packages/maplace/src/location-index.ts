import type { Location } from "./location";

// Finding a location by id in a snapshot's list, without a scan per lookup.

// Snapshot location lists are frozen (`frozenList`), so an index built once per list stays right.
const INDEXES = new WeakMap<readonly Location[], ReadonlyMap<string, Location>>();

/** The location with `id` in `locations`, a frozen list, or undefined. */
export function locationById<Data>(
  locations: readonly Location<Data>[],
  id: string,
): Location<Data> | undefined {
  return (indexById(locations) as ReadonlyMap<string, Location<Data>>).get(id);
}

function indexById(locations: readonly Location[]): ReadonlyMap<string, Location> {
  let index = INDEXES.get(locations);
  if (index === undefined) {
    index = new Map(locations.map((location) => [location.id, location]));
    INDEXES.set(locations, index);
  }
  return index;
}
