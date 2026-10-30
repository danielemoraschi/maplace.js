import { sameFilter } from "../diff/same";
import type { FilterRequest, LocationFilter } from "../location-state";
import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { filterFrom } from "../validate/filter";
import { andThen, type Change, NO_CHANGE, patchOnly } from "./change";
import { clearHidden } from "./hidden";

/** Shows only what `request` asks for (undefined: all); hiding the selected location deselects it. */
export function setFilter<Data>(snapshot: Snapshot<Data>, request: FilterRequest): Change<Data> {
  const asked = filterFrom(request, child(root("setFilter"), "filter"));
  if (sameFilter(snapshot.filter, asked)) return NO_CHANGE;
  return andThen(snapshot, patchOnly({ filter: asked && frozenCopy(asked) }), clearHidden);
}

function frozenCopy({ groups, tags }: LocationFilter): LocationFilter {
  return Object.freeze({
    groups: groups && Object.freeze([...groups]),
    tags: tags && Object.freeze([...tags]),
  });
}
