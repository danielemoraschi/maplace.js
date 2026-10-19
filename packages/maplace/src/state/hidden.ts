import type { Snapshot } from "../store";
import { andThen, type Change, NO_CHANGE } from "./change";
import { hoverReported } from "./hover";
import { isUnselectableId } from "./lookup";
import { deselect } from "./selection";

/**
 * Locations that are gone or now hidden lose the selection and the hover: what follows a
 * change of locations or of the filter.
 */
export function clearHidden<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return andThen(snapshot, NO_CHANGE, deselectHidden, unhoverHidden);
}

function deselectHidden<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return isUnselectableId(snapshot, snapshot.selectedId) ? deselect() : NO_CHANGE;
}

function unhoverHidden<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return isUnselectableId(snapshot, snapshot.hoveredId)
    ? hoverReported(snapshot, undefined)
    : NO_CHANGE;
}
