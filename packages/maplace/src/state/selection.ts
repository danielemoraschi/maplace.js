import type { Snapshot } from "../store";
import { child, type Field, root } from "../validate/fail";
import { checkNonEmptyString } from "../validate/values";
import { checkSelectOptions } from "../validate/viewport";
import type { SelectOptions } from "../viewport";
import { andThen, type Change, NO_CHANGE } from "./change";
import { checkSelectable } from "./checks";
import { isShown, locationById } from "./lookup";
import { locationView } from "./views";

const OPTIONS = child(root("select"), "options");

/**
 * Selects a location, panning to it unless `pan: false`; `undefined` clears the selection. A new
 * view on every call, so selecting the selected location again pans back to it.
 */
export function select<Data>(
  snapshot: Snapshot<Data>,
  id: string | undefined,
  options?: SelectOptions,
): Change<Data> {
  if (id === undefined) {
    checkSelectOptions(options, OPTIONS);
    return snapshot.selectedId === undefined ? NO_CHANGE : deselect();
  }
  const field = idField(id);
  checkNonEmptyString(id, field);
  checkSelectable(snapshot, id, field);
  checkSelectOptions(options, OPTIONS);
  return {
    patch: {
      selectedId: id,
      ...(options?.pan !== false && { view: locationView(id, options?.zoom) }),
    },
    events: id === snapshot.selectedId ? [] : [{ name: "select", payload: { id } }],
  };
}

/** Clears the selection and hover of locations that are gone or hidden. */
export function clearHidden<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return andThen(snapshot, NO_CHANGE, deselectHidden, unhoverHidden);
}

function deselect<Data>(): Change<Data> {
  return {
    patch: { selectedId: undefined },
    events: [{ name: "select", payload: { id: undefined } }],
  };
}

function deselectHidden<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return isHidden(snapshot, snapshot.selectedId) ? deselect() : NO_CHANGE;
}

function unhoverHidden<Data>(snapshot: Snapshot<Data>): Change<Data> {
  if (!isHidden(snapshot, snapshot.hoveredId)) return NO_CHANGE;
  return {
    patch: { hoveredId: undefined },
    events: [{ name: "hover", payload: { id: undefined } }],
  };
}

function isHidden(snapshot: Snapshot<unknown>, id: string | undefined): boolean {
  if (id === undefined) return false;
  const location = locationById(snapshot.locations, id);
  return location === undefined || !isShown(location, snapshot.filter);
}

function idField(id: unknown): Field {
  return child(root("select", typeof id === "string" ? id : undefined), "id");
}
