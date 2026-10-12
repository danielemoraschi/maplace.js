import { sameItems } from "../diff/same";
import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import type { Snapshot } from "../store";
import { validateLocations } from "../validate/locations";
import { andThen, type Change, NO_CHANGE, patchOnly } from "./change";
import { frozenList, isHeld } from "./lookup";
import { pruneRoute } from "./route";
import { clearHidden } from "./selection";

/**
 * Replaces the locations. Locations that are gone or now hidden lose the selection and hover,
 * and route stops whose location is gone are dropped. Objects the store already holds are not
 * validated again: a location changes by replacing its object, as the diff assumes.
 */
export function setLocations<Data>(
  snapshot: Snapshot<Data>,
  locations: readonly Location<Data>[],
  context: Pick<MaplaceOptions, "sanitize">,
): Change<Data> {
  validateLocations(locations, {
    caller: "setLocations",
    sanitize: context.sanitize,
    isKnown: (value) => isHeld(snapshot.locations, value),
  });
  if (sameItems(snapshot.locations, locations)) return NO_CHANGE;
  return andThen(
    snapshot,
    patchOnly({ locations: frozenList(locations) }),
    clearHidden,
    pruneRoute,
  );
}
