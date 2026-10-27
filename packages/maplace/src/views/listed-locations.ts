import type { Location } from "../location";
import type { Snapshot } from "../store";
import { listedEntries } from "./model";

/**
 * What maplace's list views list in `snapshot`: the shown locations not `listed: false`, in data
 * order, whatever their groups, unfiltered by the view: a list with `scope` narrows them to it.
 * A page's own list uses it to list the same.
 */
export function listedLocations<Data>(snapshot: Snapshot<Data>): readonly Location<Data>[] {
  return listedEntries(snapshot);
}
