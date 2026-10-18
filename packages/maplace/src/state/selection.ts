import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkSelectOptions } from "../validate/viewport";
import type { SelectOptions } from "../viewport";
import { type Change, NO_CHANGE } from "./change";
import { checkSelectableId } from "./checks";
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
    return deselectIfSelected(snapshot);
  }
  checkSelectableId(snapshot, { method: "select", id });
  checkSelectOptions(options, OPTIONS);
  return selectShown(snapshot, id, options);
}

/** Selects a location the caller already knows is shown, bringing it into view unless `pan: false`. */
export function selectShown<Data>(
  snapshot: Snapshot<Data>,
  id: string,
  options?: SelectOptions,
): Change<Data> {
  return {
    patch: {
      selectedId: id,
      ...(options?.pan !== false && { view: locationView(id, options?.zoom) }),
    },
    events: id === snapshot.selectedId ? [] : [{ name: "selectionChange", payload: { id } }],
  };
}

/** Clears the selection, if there is one. */
export function deselectIfSelected<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return snapshot.selectedId === undefined ? NO_CHANGE : deselect();
}

/**
 * Clears the selection and fires `selectionChange` with no id; callers check there is one to
 * clear.
 */
export function deselect<Data>(): Change<Data> {
  return {
    patch: { selectedId: undefined },
    events: [{ name: "selectionChange", payload: { id: undefined } }],
  };
}
