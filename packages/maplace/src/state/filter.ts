import { sameFilter } from "../diff/same";
import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkGroups } from "../validate/filter";
import { andThen, type Change, NO_CHANGE, patchOnly } from "./change";
import { clearHidden } from "./hidden";

/** Shows only these groups (undefined: all); hiding the selected location deselects it. */
export function setFilter<Data>(
  snapshot: Snapshot<Data>,
  groups: readonly string[] | undefined,
): Change<Data> {
  checkGroups(groups, child(root("setFilter"), "groups"));
  if (sameFilter(snapshot.filter, groups)) return NO_CHANGE;
  const filter = groups && Object.freeze([...groups]);
  return andThen(snapshot, patchOnly({ filter }), clearHidden);
}
