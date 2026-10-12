import type { Snapshot } from "../store";
import { type Change, NO_CHANGE } from "./change";
import { isHiddenId } from "./lookup";

/**
 * The pointer or focus moved onto a location, or off it (`undefined`); `hover` fires when that
 * changed. An id the store no longer shows is a race with a diff still being drawn: no change.
 */
export function hover<Data>(snapshot: Snapshot<Data>, id: string | undefined): Change<Data> {
  if (id === snapshot.hoveredId) return NO_CHANGE;
  if (isHiddenId(snapshot, id)) return NO_CHANGE;
  return { patch: { hoveredId: id }, events: [{ name: "hover", payload: { id } }] };
}
