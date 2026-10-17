import type { Snapshot } from "../store";
import { type Change, NO_CHANGE } from "./change";
import { checkSelectableId } from "./checks";
import { isHiddenId } from "./lookup";

/**
 * Marks the location under the pointer or keyboard focus, or none (`undefined`), as a page or
 * view asks: an unknown or hidden id throws, as for `select`.
 */
export function hover<Data>(snapshot: Snapshot<Data>, id: string | undefined): Change<Data> {
  if (id !== undefined) checkSelectableId(snapshot, { method: "hover", id });
  return hoverReported(snapshot, id);
}

/**
 * The pointer or focus moved onto a location, or off it (`undefined`), as the map reports it;
 * `hoverChange` fires when that changed. An id the store no longer shows is a race with a diff
 * still being drawn: no change.
 */
export function hoverReported<Data>(
  snapshot: Snapshot<Data>,
  id: string | undefined,
): Change<Data> {
  if (id === snapshot.hoveredId) return NO_CHANGE;
  if (isHiddenId(snapshot, id)) return NO_CHANGE;
  return { patch: { hoveredId: id }, events: [{ name: "hoverChange", payload: { id } }] };
}
