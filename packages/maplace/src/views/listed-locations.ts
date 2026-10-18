import type { Location } from "../location";
import { isListed } from "../location-state";
import type { Snapshot } from "../store";

/**
 * What maplace's list views list in `snapshot`: the shown locations not `listed: false`, in data
 * order, whatever their groups. A page's own list uses it to list the same.
 */
export function listedLocations<Data>(snapshot: Snapshot<Data>): readonly Location<Data>[] {
  return snapshot.locations.filter((location) => isListed(location, snapshot.filter));
}
