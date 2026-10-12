import type { Snapshot } from "../store";
import { type Change, NO_CHANGE } from "./change";
import { isHiddenId } from "./lookup";
import { deselectIfSelected, selectShown } from "./selection";

/**
 * A click on a location, which always pans (RFC §4), or on the map itself (`undefined`), which
 * deselects. An id the store no longer shows is a race with a diff still being drawn: no change.
 */
export function selectReported<Data>(
  snapshot: Snapshot<Data>,
  id: string | undefined,
): Change<Data> {
  if (id === undefined) return deselectIfSelected(snapshot);
  return isHiddenId(snapshot, id) ? NO_CHANGE : selectShown(snapshot, id);
}
